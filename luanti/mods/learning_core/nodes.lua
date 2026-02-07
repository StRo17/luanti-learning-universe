-- nodes.lua

minetest.register_node("learning_core:teacher_reward_block", {
    description = "Lehrer-Belohnungs-Block",
    tiles = {"default_gold_block.png^[colorize:#FFD700:50"},
    groups = {cracky = 1, level = 2},
    
    on_rightclick = function(pos, node, clicker, itemstack, pointed_thing)
        local name = clicker:get_player_name()
        local meta = minetest.get_meta(pos)
        local event_id = meta:get_string("event_id")

        if event_id == "" then
            minetest.chat_send_player(name, "❌ Dieser Block ist noch nicht konfiguriert.")
            return
        end

        learning_core.query_api("/items/teacher_events/" .. event_id, "GET", nil, function(data)
            if data and data.data then
                local event = data.data
                -- Hinweis: Das Backend prüft beim Einlösen die Zeit, wir zeigen hier nur den Code an
                minetest.chat_send_player(name, "👨‍🏫 Belohnung für: " .. event.title)
                minetest.chat_send_player(name, "Dein Code: " .. minetest.colorize("#FFFF00", event.completion_code))
                minetest.chat_send_player(name, "Gib nun /finished " .. event.completion_code .. " ein.")
            else
                minetest.chat_send_player(name, "❌ Dieses Event existiert nicht mehr.")
            end
        end)
    end,
})

minetest.register_tool("learning_core:teacher_wand", {
    description = "Lehrer-Zauberstab",
    inventory_image = "default_stick.png^[colorize:#FF0000:80",
    on_use = function(itemstack, user, pointed_thing)
        local name = user:get_player_name()
        if not minetest.check_player_privs(name, {server=true}) then return end

        if pointed_thing.type == "node" then
            local pos = pointed_thing.under
            if minetest.get_node(pos).name == "learning_core:teacher_reward_block" then
                learning_core.last_pos[name] = pos
                minetest.show_formspec(name, "llu:config", 
                    "size[6,3]field[1,1;4,1;eid;Event-ID (UUID);]button_exit[1,2;4,1;save;Speichern]")
            end
        end
    end
})

minetest.register_on_player_receive_fields(function(player, formname, fields)
    if formname == "llu:config" and fields.save then
        local name = player:get_player_name()
        local pos = learning_core.last_pos[name]
        if pos then
            local meta = minetest.get_meta(pos)
            meta:set_string("event_id", fields.eid)
            minetest.chat_send_player(name, "✅ Block mit Event verknüpft.")
        end
    end
end)