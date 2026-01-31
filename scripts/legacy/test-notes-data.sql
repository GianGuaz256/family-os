-- Test data for Notes feature
-- This script adds sample notes with various markdown content to test the functionality
-- Replace the UUIDs with actual values from your family_groups and users

-- Variables - UPDATE THESE WITH YOUR ACTUAL IDs
-- You can get these by running: SELECT id, name FROM family_groups; and SELECT id, email FROM auth.users;

-- Example family group ID (replace with your actual family group ID)
-- Example user IDs (replace with actual user IDs from your family)

-- Insert sample notes with various markdown content
INSERT INTO public.notes (group_id, title, content, is_important, created_by, created_at) VALUES 

-- Simple text note
('your-family-group-id-here', 'Regole della casa', 
'Se il dio è un cane, lo puoi sapere solo dentro di te.

Queste sono le regole fondamentali della nostra famiglia.', 
true, 'your-user-id-here', '2025-01-25 10:00:00+00'),

-- Note with headers and lists
('your-family-group-id-here', 'Lista della spesa settimanale', 
'# Lista della Spesa 🛒

## Verdure e Frutta
- [ ] Pomodori
- [ ] Insalata
- [x] Banane
- [ ] Mele
- [ ] Carote

## Latticini
- [ ] Latte intero
- [ ] Yogurt greco
- [ ] Formaggio parmigiano

## Carne e Pesce
- [ ] Pollo per domenica
- [ ] Salmone fresco
- [ ] Prosciutto cotto

**Note**: Controllare le date di scadenza!', 
false, 'your-user-id-here', '2025-01-25 09:30:00+00'),

-- Technical note with code
('your-family-group-id-here', 'Configurazione WiFi Casa', 
'# Configurazione WiFi 📶

## Credenziali Rete Principale
- **Nome rete**: `FamilyHome_5G`
- **Password**: `SuperSecretPassword123!`

## Configurazione Router
```bash
# Accesso admin
http://192.168.1.1
Username: admin
Password: admin123
```

## Dispositivi Connessi
| Dispositivo | IP | MAC Address |
|-------------|----|-----------| 
| iPhone Marco | 192.168.1.10 | AA:BB:CC:DD:EE:FF |
| Laptop Sara | 192.168.1.11 | 11:22:33:44:55:66 |
| Smart TV | 192.168.1.20 | FF:EE:DD:CC:BB:AA |

> ⚠️ **Importante**: Non condividere la password con esterni!', 
false, 'your-user-id-here', '2025-01-25 08:45:00+00'),

-- Recipe note
('your-family-group-id-here', 'Ricetta Pasta alla Carbonara', 
'# Pasta alla Carbonara 🍝

*La ricetta della nonna, quella vera!*

## Ingredienti (per 4 persone)
- 400g spaghetti
- 200g guanciale
- 4 uova intere + 2 tuorli
- 100g Pecorino Romano grattugiato
- Pepe nero q.b.
- Sale per l''acqua

## Preparazione

### 1. Preparare il condimento
1. Mettere le uova in una ciotola con il pecorino e il pepe
2. Mescolare bene fino ad ottenere una crema

### 2. Cuocere il guanciale
- Tagliare il guanciale a listarelle
- Rosolare in padella senza olio fino a farlo diventare croccante

### 3. Cuocere la pasta
- Cuocere gli spaghetti in abbondante acqua salata
- **Importante**: al dente!

### 4. Mantecatura
> 🔥 **Trucco**: Aggiungere un po'' di acqua di cottura alla crema di uova

**Buon appetito!** 😋', 
false, 'your-user-id-here', '2025-01-24 19:30:00+00'),

-- Emergency contact note
('your-family-group-id-here', 'Contatti di Emergenza', 
'# Contatti di Emergenza 🚨

## Servizi di Emergenza
- **Carabinieri**: 112
- **Vigili del Fuoco**: 115
- **Emergenza Sanitaria**: 118
- **Polizia**: 113

## Medici di Famiglia
| Nome | Telefono | Specialità |
|------|----------|------------|
| Dott. Rossi | 339-1234567 | Medico di base |
| Dott.ssa Bianchi | 347-9876543 | Pediatra |

## Servizi Casa
- **Idraulico**: Mario - 328-5555555
- **Elettricista**: Giuseppe - 333-4444444  
- **Amministratore**: 06-12345678

## Numeri Utili
- **Numero casa**: 06-87654321
- **Vicini di casa**: 
  - Casa 12A: Famiglia Verdi - 339-1111111
  - Casa 12C: Sig.ra Neri - 347-2222222

---
*Aggiornato: Gennaio 2025*', 
false, 'your-user-id-here', '2025-01-24 15:20:00+00'),

-- Travel planning note
('your-family-group-id-here', 'Vacanze Estive 2025', 
'# Vacanze Estive 2025 ✈️🏖️

## Opzioni Destinazioni

### Opzione 1: Grecia 🇬🇷
- **Periodo**: 15-29 Luglio
- **Isola**: Santorini + Mykonos
- **Budget stimato**: €3.500
- **Pro**: Mare stupendo, cultura
- **Contro**: Molto turistico

### Opzione 2: Portogallo 🇵🇹  
- **Periodo**: 1-15 Agosto
- **Città**: Lisbona + Porto + Algarve
- **Budget stimato**: €2.800
- **Pro**: Più economico, ottimo cibo
- **Contro**: Può essere ventoso

## Todo List
- [ ] Confrontare prezzi voli
- [ ] Verificare disponibilità hotel
- [ ] Controllo passaporti (scadenza)
- [ ] Prenotare pet sitter per Fido
- [ ] Assicurazione viaggio

## Link Utili
- [Skyscanner](https://www.skyscanner.it)
- [Booking.com](https://www.booking.com)
- [TripAdvisor Reviews](https://www.tripadvisor.it)

**Decisione finale entro**: 15 Febbraio 2025

---
*"Il mondo è un libro e chi non viaggia ne legge solo una pagina"* - Sant''Agostino', 
false, 'your-user-id-here', '2025-01-23 20:15:00+00'),

-- Movie/entertainment list
('your-family-group-id-here', 'Film e Serie TV da Vedere', 
'# 🎬 Film e Serie TV da Vedere

## Film al Cinema (2025)
- [ ] **Dune: Part Three** - Marzo 2025
- [ ] **Avatar 4** - Dicembre 2025
- [x] ~~**Oppenheimer**~~ - Visto! ⭐⭐⭐⭐⭐

## Serie TV Netflix
### In corso
- **Stranger Things** (Stagione 5) - In attesa
- **The Crown** (Stagione 6) - 3 episodi rimasti

### Da iniziare  
- [ ] **Wednesday** 
- [ ] **Glass Onion** 
- [ ] **The Queen''s Gambit** (rewatch)

## Film Famiglia Weekend
> 💡 **Suggerimento**: Ogni venerdì sera scegliamo insieme!

### Commedie
- The Grand Budapest Hotel
- Life of Brian  
- Paddington 1 & 2

### Avventura
- Indiana Jones (saga completa)
- The Princess Bride
- Back to the Future trilogy

## Valutazioni
| Titolo | Voto Marco | Voto Sara | Media |
|--------|------------|-----------|-------|
| Top Gun: Maverick | 9/10 | 8/10 | 8.5/10 |
| Everything Everywhere | 10/10 | 9/10 | 9.5/10 |

*Lista aggiornata ogni domenica* 📅', 
false, 'your-user-id-here', '2025-01-22 16:30:00+00');

-- Instructions for using this test data
/*
INSTRUCTIONS FOR USING THIS TEST DATA:

1. First, get your actual IDs by running these queries in Supabase:

   -- Get your family group ID
   SELECT id, name FROM family_groups;
   
   -- Get user IDs  
   SELECT id, email FROM auth.users;

2. Replace ALL instances of:
   - 'your-family-group-id-here' with your actual family group ID
   - 'your-user-id-here' with your actual user ID

3. You can also create notes for different users by using different user IDs

4. After inserting, you can test:
   - Viewing notes in grid layout
   - Clicking to view full content in modal
   - Editing notes (only your own)
   - Marking as important (only if you're group owner)
   - Mobile vs desktop editor experience

5. The test data includes:
   - Simple text
   - Headers and lists  
   - Tables
   - Code blocks
   - Links
   - Checkboxes
   - Quotes
   - Emojis
   - Various markdown formatting

EXAMPLE REPLACEMENT:
If your family group ID is: a1b2c3d4-e5f6-7890-abcd-ef1234567890
And your user ID is: 12345678-abcd-efgh-ijkl-mnop12345678

Replace:
'your-family-group-id-here' → 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  
'your-user-id-here' → '12345678-abcd-efgh-ijkl-mnop12345678'
*/ 