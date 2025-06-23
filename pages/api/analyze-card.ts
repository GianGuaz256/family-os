import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API route called:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image } = req.body
    console.log('Image data received:', image ? 'Yes' : 'No')

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key missing')
      return res.status(400).json({ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this loyalty/membership card image and extract information in JSON format:
              
              {
                "name": "Card display name based on brand (e.g., 'Tesco Clubcard', 'Starbucks Card')",
                "brand": "Store/company name if visible",
                "card_number": "ANY numbers you can see - member ID, card number, account number",
                "barcode": "The barcode number (usually under the barcode lines)",
                "points_balance": "Points balance or money balance if shown",
                "expiry_date": "Expiry date in MM/YY format if shown",
                "notes": "Any other text like card type, benefits, etc."
              }
              
              IMPORTANT INSTRUCTIONS:
              - Look carefully for ANY numbers on the card - these are often the most important part
              - Barcode numbers are usually printed below the black bars
              - Card numbers can be anywhere on the card
              - For brand, look for company logos or store names
              - If you see numbers like "2 357 517 607 818", put them in both card_number and barcode fields
              - Be thorough - extract ALL visible numbers and text
              - If this appears to be a loyalty/membership card, extract everything you can see`
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Try to parse JSON from the response
    let cardInfo
    try {
      // Extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cardInfo = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      // Fallback: try to extract information manually
      cardInfo = extractInfoFromText(content)
    }

    // Clean up the extracted information
    const cleanedInfo = {
      name: cardInfo?.name || null,
      brand: cardInfo?.brand || null,
      card_number: cardInfo?.card_number || null,
      barcode: cardInfo?.barcode || null,
      points_balance: cardInfo?.points_balance || null,
      expiry_date: cardInfo?.expiry_date || null,
      notes: cardInfo?.notes || null
    }

    // Remove null values
    const finalInfo = Object.fromEntries(
      Object.entries(cleanedInfo).filter(([_, v]) => v !== null && v !== '')
    )

    res.status(200).json({ cardInfo: finalInfo })

  } catch (error) {
    console.error('OpenAI analysis error:', error)
    res.status(500).json({ 
      error: 'Failed to analyze image', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Fallback function to extract info from text response
function extractInfoFromText(text: string) {
  const info: any = {}
  
  // Look for common patterns in the text
  const lines = text.split('\n')
  
  for (const line of lines) {
    const lower = line.toLowerCase()
    
    if (lower.includes('name') && lower.includes(':')) {
      const match = line.match(/name[:\s]+(.+)/i)
      if (match) info.name = match[1].trim()
    }
    
    if (lower.includes('brand') && lower.includes(':')) {
      const match = line.match(/brand[:\s]+(.+)/i)
      if (match) info.brand = match[1].trim()
    }
    
    if ((lower.includes('card') || lower.includes('member')) && lower.includes('number')) {
      const match = line.match(/(?:card|member)\s*number[:\s]+(\d+)/i)
      if (match) info.card_number = match[1]
    }
    
    if (lower.includes('points') || lower.includes('balance')) {
      const match = line.match(/(?:points|balance)[:\s]+(\d+(?:,\d+)?)/i)
      if (match) info.points_balance = match[1]
    }
    
    if (lower.includes('expiry') || lower.includes('expires')) {
      const match = line.match(/(?:expiry|expires)[:\s]+(\d{1,2}\/\d{2,4})/i)
      if (match) info.expiry_date = match[1]
    }
  }
  
  return info
} 