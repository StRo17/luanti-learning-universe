-- gamification.lua (Vollautomatisch)

-- Erhöht die Frequenz für das "Live"-Gefühl (alle 5-10 Sekunden)
local SYNC_INTERVAL = 10 

function learning_core.trigger_dopamine(player_name, amount)
    local player = minetest.get_player_by_name(player_name)
    if not player then return end

    -- Sound & Visuelles Feedback sofort
    minetest.sound_play("default_message", {to_player = player_name, gain = 1.5})
    
    local hud_id = player:hud_add({
        hud_elem_type = "text",
        position = {x = 0.5, y = 0.4},
        text = "🚀 QUEST-ERFOLG! + " .. amount .. " XP 🚀",
        number = 0x00FF00, -- Grün für Erfolg
        scale = {x = 100, y = 100},
    })

    minetest.after(7, function()
        if minetest.get_player_by_name(player_name) then
            player:hud_remove(hud_id)
        end
    end)
    
    minetest.chat_send_player(player_name, minetest.colorize("#00FF00", "[LMS] Automatisch synchronisiert: Du hast neue Punkte erhalten!"))
end

-- Der Beobachter-Prozess
local function run_automatic_sync()
    local players = minetest.get_connected_players()
    for i, player in ipairs(players) do
        local name = player:get_player_name()
        
        -- Versetzter Aufruf, um API-Spitzen zu vermeiden
        minetest.after(i * 0.2, function()
            local p = minetest.get_player_by_name(name)
            if not p then return end
            
            local endpoint = "/users?filter[luanti_name][_eq]=" .. name .. "&fields=xp_total"
            learning_core.query_api(endpoint, "GET", nil, function(data)
                if data and data.data and data.data[1] then
                    local remote_xp = tonumber(data.data[1].xp_total) or 0
                    local meta = p:get_meta()
                    local local_xp = meta:get_int("xp") or 0

                    -- DER MAGISCHE MOMENT:
                    if remote_xp > local_xp then
                        local diff = remote_xp - local_xp
                        meta:set_int("xp", remote_xp) -- Update Lokal
                        learning_core.trigger_dopamine(name, diff)
                    elseif remote_xp < local_xp then
                        -- Falls XP im Admin-Panel zurückgesetzt wurden
                        meta:set_int("xp", remote_xp)
                    end
                end
            end)
        end)
    end
    minetest.after(SYNC_INTERVAL, run_automatic_sync)
end

-- Startet den Beobachter
minetest.after(5, run_automatic_sync)