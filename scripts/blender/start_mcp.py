"""Start the installed local MCP addon in a dedicated Blender session."""
import bpy
import blender_mcp
if not hasattr(bpy.types.Scene, 'blender_mcp_port'):
    blender_mcp.register()
bpy.ops.blendermcp.start_server()
