-- luanti/mods/learning_core/init.lua

local mod_name = minetest.get_current_modname()
local http_api = minetest.request_http_api()

minetest.log("action", "[" .. mod_name .. "] Mod wird geladen...")

if not http_api then
    minetest.log("error", "[" .. mod_name .. "] FEHLER: HTTP API nicht verfügbar! Bitte 'secure.http_mods = " .. mod_name .. "' in minetest.conf prüfen.")
    return
end

-- Konfiguration: Directus URL (im Docker Netzwerk heißt der Host 'directus')
local directus_url = "http://directus:8055"

-- Funktion: Server Ping
local function test_connection()
    minetest.log("action", "[" .. mod_name .. "] Teste Verbindung zu Directus (" .. directus_url .. ")...")

    local request = {
        url = directus_url .. "/server/ping",
        timeout = 5,
        method = "GET"
    }

    http_api.fetch(request, function(result)
        if result.succeeded then
            minetest.log("action", "[" .. mod_name .. "] ✅ ERFOLG: Verbindung zu Directus hergestellt! Antwort: " .. result.data)
        else
            minetest.log("error", "[" .. mod_name .. "] ❌ FEHLER: Konnte Directus nicht erreichen. Code: " .. (result.code or "nil"))
        end
    end)
end

-- Test beim Start ausführen (nach 3 Sekunden Verzögerung, damit alles initiiert ist)
minetest.after(3, test_connection)