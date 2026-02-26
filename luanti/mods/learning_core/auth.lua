-- auth.lua
minetest.register_on_joinplayer(function(player)
    local name = player:get_player_name()
    
    -- Verwende Container-Name für interne Kommunikation
    local api_url = os.getenv("LUANTI_API_URL") or "http://directus:8055"
    local endpoint = api_url .. "/users?filter[luanti_name][_eq]=" .. name .. "&fields=xp_total"
    
    -- Debug-Logging vor dem Request
    minetest.log("action", "[Auth] Checking User "..name.." at URL: "..endpoint)
    
    learning_core.query_api(endpoint, "GET", nil, function(data)
        if not data or not data.data or #data.data == 0 then
            minetest.log("error", "[Auth] User nicht gefunden: "..name)
            minetest.kick_player(name, "❌ Kein LMS-Account gefunden!")
        else
            local remote_xp = tonumber(data.data[1].xp_total) or 0
            player:get_meta():set_int("xp", remote_xp)
            
            -- Debug-Logging nach dem Request
            minetest.log("action", "[Auth] Response for "..name..": Code=200, XP="..remote_xp)
            
            minetest.chat_send_player(name, "✅ Willkommen! Dein LMS-Profil ist geladen.")
        end
    end)
end)