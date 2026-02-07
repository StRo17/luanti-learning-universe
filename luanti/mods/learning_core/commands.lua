-- commands.lua

minetest.register_chatcommand("xp", {
    description = "Zeigt deinen aktuellen XP-Stand vom LMS an.",
    func = function(name)
        local player = minetest.get_player_by_name(name)
        if player then
            local xp = player:get_meta():get_int("xp")
            return true, "Dein aktueller Stand: " .. xp .. " XP (Synchronisiert mit dem LMS)"
        end
    end,
})

-- Der /finished Befehl wird GELÖSCHT. Er wird nicht mehr gebraucht.