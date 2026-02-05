-- ==================================================================
-- LUANTI LEARNING CORE - MOD V2 (mit Token System)
-- ==================================================================

local mod_name = minetest.get_current_modname()
local http_api = minetest.request_http_api()

minetest.log("action", "[" .. mod_name .. "] Core Mod wird initialisiert...")

-- 1. SECURITY CHECK
if not http_api then
    local msg = "CRITICAL ERROR: HTTP API denied! Set 'secure.http_mods = " .. mod_name .. "' in minetest.conf"
    error(msg)
end

-- 2. KONFIGURATION
-- Backend URL
local backend_url = "http://directus:8055" 
-- API Key für den 'Luanti Bot' Service Account
local auth_token = "Y92TO9PQOB_LsN33VfoJ71fgFnRholLh" 

-- 3. HELPER: CODE GENERATOR
-- Erzeugt Codes wie "K9X2" (ohne verwirrende Zeichen wie I/1/0/O)
local charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
local function generate_code(length)
    local ret = ""
    for i = 1, length do
        local rand = math.random(1, #charset)
        ret = ret .. string.sub(charset, rand, rand)
    end
    return ret
end

-- 4. API: TOKEN UPLOAD
local function upload_token(player_name, quest_id, token)
    local payload = minetest.write_json({
        token = token,
        quest_id = quest_id,
        is_claimed = false
    })

    local request = {
        url = backend_url .. "/items/claimable_tokens",
        timeout = 5,
        method = "POST",
        data = payload,
        extra_headers = {
            "Content-Type: application/json",
            "Authorization: Bearer " .. auth_token
        }
    }

    minetest.log("action", "[" .. mod_name .. "] Uploading Token " .. token .. " for Quest " .. quest_id)

    http_api.fetch(request, function(res)
        if res.succeeded and (res.code == 200 or res.code == 204) then
            -- ERFOLG
            minetest.chat_send_player(player_name, "")
            minetest.chat_send_player(player_name, "=================================")
            minetest.chat_send_player(player_name, "   🏆  QUEST ABGESCHLOSSEN!  🏆")
            minetest.chat_send_player(player_name, "=================================")
            minetest.chat_send_player(player_name, "Dein Code lautet: " .. minetest.colorize("#00FF00", token))
            minetest.chat_send_player(player_name, "Gib diesen Code jetzt im Browser ein.")
            minetest.chat_send_player(player_name, "=================================")
            
            minetest.sound_play("finish_sound", {to_player=player_name, gain=1.0}, true) -- Optional
        else
            -- FEHLER
            minetest.log("error", "Token Upload Failed: Code " .. (res.code or "nil"))
            minetest.chat_send_player(player_name, "❌ Fehler beim Speichern! Code: " .. (res.code or "unknown"))
            minetest.chat_send_player(player_name, "Bitte melde dies dem Lehrer.")
        end
    end)
end

-- 5. CHAT BEFEHL (Simulation)
-- Usage: /finish <quest_uuid_aus_url>
minetest.register_chatcommand("finish", {
    params = "<quest_id>",
    description = "Schließt eine Quest ab und generiert Token",
    func = function(name, param)
        if param == "" then
            return false, "Bitte Quest-ID angeben! (Aus der URL kopieren)"
        end
        
        local token = generate_code(6)
        upload_token(name, param, token)
        return true
    end,
})

-- 6. HEALTH CHECK (Beim Start)
minetest.after(5, function()
    local req = { url = backend_url .. "/server/ping", method = "GET", timeout = 2 }
    http_api.fetch(req, function(res)
        if res.succeeded then
            minetest.log("action", "["..mod_name.."] ✅ Backend Connection OK.")
        else
            minetest.log("error", "["..mod_name.."] ❌ Backend Connection FAILED.")
        end
    end)
end)

minetest.log("action", "[" .. mod_name .. "] Ready.")