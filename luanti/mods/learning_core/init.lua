learning_core = {
    modpath = minetest.get_modpath("learning_core"),
    http = minetest.request_http_api(),
    last_pos = {}, -- Speicher für Lehrer-Konfiguration
}

-- 1. SECURITY CHECK
if not learning_core.http then
    local msg = "[LLU] KRITISCH: HTTP API verweigert! Setze 'secure.http_mods = learning_core' in der minetest.conf"
    minetest.log("error", msg)
    error(msg)
end

-- 2. KONFIGURATION
learning_core.backend_url = minetest.settings:get("llu_backend_url") or "http://directus:8055"
learning_core.api_token = minetest.settings:get("llu_api_token")

if not learning_core.api_token or learning_core.api_token == "" then
    error("[LLU] KRITISCH: llu_api_token fehlt in der minetest.conf!")
end

-- 3. MODULE LADEN (Reihenfolge ist wichtig!)
dofile(learning_core.modpath .. "/api.lua")          
dofile(learning_core.modpath .. "/gamification.lua") 
dofile(learning_core.modpath .. "/auth.lua")         
dofile(learning_core.modpath .. "/nodes.lua")        
dofile(learning_core.modpath .. "/commands.lua")     

minetest.log("action", "[LLU] LearnFirstEngine V3.0 geladen.")