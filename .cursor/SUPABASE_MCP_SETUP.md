# Supabase MCP Server Setup Guide

This guide will help you complete the setup of the Supabase MCP (Model Context Protocol) server for your Cursor IDE.

## ✅ Step 1: Configuration File Created

The MCP configuration file has been created at `.cursor/mcp.json` with the basic Supabase MCP server URL.

## 🔐 Step 2: Authentication

When you restart Cursor or when Cursor detects the new MCP configuration, it will automatically prompt you to authenticate:

1. **Automatic Browser Authentication**: Cursor will open a browser window asking you to log in to your Supabase account
2. **Grant Organization Access**: You'll be asked to grant organization access to the MCP client
3. **Select Organization**: Choose the organization that contains your Family OS project

**Note**: The hosted Supabase MCP server uses dynamic client registration, so you don't need to manually create a personal access token (PAT) or OAuth app.

## 🎯 Step 3: Optional - Scope to Specific Project

If you want to limit the MCP server to only access your specific Supabase project, you can update `.cursor/mcp.json` to include your project reference:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

To find your project reference:
1. Go to your Supabase dashboard
2. Select your project
3. Go to Settings > General
4. Copy the "Reference ID" (it looks like `abcdefghijklmnop`)

## 🔍 Step 4: Verify Connection

After authentication, verify the connection works:

1. **Restart Cursor** (if it didn't automatically detect the MCP server)
2. Navigate to **Settings > Cursor Settings > Tools & MCP**
3. You should see the Supabase MCP server listed
4. Test it by asking Cursor: "What tables are there in the database? Use MCP tools."

## 🛡️ Security Best Practices

**IMPORTANT**: Before using the MCP server, review these security considerations:

### ⚠️ Security Risks

1. **Don't connect to production**: Use the MCP server with a development project, not production
2. **Don't give to customers**: The MCP server operates under your developer permissions
3. **Manual approval**: Keep manual approval of tool calls enabled in Cursor settings
4. **Read-only mode**: Consider using read-only mode if you must connect to real data
5. **Project scoping**: Scope to a specific project to limit access (see Step 3 above)

### 🔒 Recommended Configuration for Development

For safer development, you can configure the MCP server with additional options:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
    }
  }
}
```

## 📋 Available MCP Tools

Once connected, the Supabase MCP server provides tools for:

- **Database Operations**: Query tables, run SQL, manage schema
- **Authentication**: Manage users and sessions
- **Storage**: Manage file storage buckets and files
- **Edge Functions**: Deploy and manage Edge Functions
- **Realtime**: Manage Realtime channels and subscriptions

## 🚀 Next Steps

1. **Restart Cursor** to load the MCP configuration
2. **Authenticate** when prompted
3. **Test the connection** with a simple query
4. **Review security settings** and configure project scoping if needed

## 📚 Additional Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)

## 🐛 Troubleshooting

### MCP Server Not Appearing

1. Ensure `.cursor/mcp.json` is in your project root
2. Restart Cursor completely
3. Check Cursor Settings > Tools & MCP for any error messages

### Authentication Issues

1. Clear browser cache and try again
2. Ensure you're logged into the correct Supabase account
3. Check that you have the necessary permissions in your Supabase organization

### Connection Errors

1. Verify your internet connection
2. Check if `https://mcp.supabase.com/mcp` is accessible
3. Review Cursor's error logs for detailed error messages

## 💡 Usage Examples

Once set up, you can use natural language queries like:

- "Show me all tables in the database"
- "What's the schema of the family_groups table?"
- "List all users in the profiles table"
- "Create a new table for notes with columns: id, title, content"
- "What are the RLS policies on the documents table?"

The MCP server will translate these into appropriate Supabase operations.
