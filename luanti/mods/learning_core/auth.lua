-- auth.lua
minetest.register_on_joinplayer(function(player)
    local name = player:get_player_name()
    local endpoint = "/users?filter[luanti_name][_eq]=" .. name .. "&fields=xp_total"
    
    learning_core.query_api(endpoint, "GET", nil, function(data)
        if not data or not data.data or #data.data == 0 then
            minetest.kick_player(name, "❌ Kein LMS-Account gefunden!")
        else
            local remote_xp = tonumber(data.data[1].xp_total) or 0
            player:get_meta():set_int("xp", remote_xp)
            minetest.chat_send_player(name, "✅ Willkommen! Dein LMS-Profil ist geladen.")
        end
    end)
end)