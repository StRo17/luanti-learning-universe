local mod_name = minetest.get_current_modname()
local http_api = minetest.request_http_api()

minetest.log("action", "[" .. mod_name .. "] Core Mod wird initialisiert...")

-- 1. Sicherheits-Check (Verhindert Start bei Fehlkonfiguration)
if not http_api then
    local msg = "CRITICAL ERROR: HTTP API denied! Set 'secure.http_mods = " .. mod_name .. "' in minetest.conf"
    minetest.log("error", msg)
    error(msg) -- Erzwingt Crash, damit man den Fehler sofort sieht
end

-- 2. Konfiguration
-- WICHTIG: Interner Docker-Hostname. Nicht ändern, solange beide im selben Netz sind.
-- Wir nutzen HTTP, da SSL intern unnötig Overhead erzeugt und Zertifikate kompliziert macht.
local backend_url = "http://directus:8055"
local ping_endpoint = "/server/ping" 

-- 3. Core Funktion: Verbindungstest
local function check_connection(player_name)
    local log_target = player_name or "SYSTEM"
    minetest.log("action", "[" .. mod_name .. "] Pinge Backend (" .. backend_url .. ")...")

    local request = {
        url = backend_url .. ping_endpoint,
        timeout = 5,
        method = "GET"
    }

    http_api.fetch(request, function(result)
        if result.succeeded then
            local status_msg = "✅ BACKEND ONLINE (Response: " .. (result.data or "empty") .. ")"
            minetest.log("action", "[" .. mod_name .. "] " .. status_msg)
            
            -- Feedback an Admin im Spiel, falls manuell ausgelöst
            if player_name then
                minetest.chat_send_player(player_name, status_msg)
            end
        else
            local err_msg = "❌ BACKEND OFFLINE (Code: " .. (result.code or "nil") .. ")"
            minetest.log("error", "[" .. mod_name .. "] " .. err_msg)
            
            if player_name then
                minetest.chat_send_player(player_name, err_msg)
            else
                -- Warnung an alle Admins/Lehrer im Spiel senden
                minetest.chat_send_all("WARNUNG: Lern-Server Verbindung unterbrochen!")
            end
        end
    end)
end

-- 4. Auto-Start Test (Verzögert, damit Netzwerk stabil ist)
minetest.after(5, function() check_connection(nil) end)

-- 5. Admin-Befehl für manuellen Test (WICHTIG für Ops)
minetest.register_chatcommand("status", {
    params = "",
    description = "Prüft Verbindung zum Directus Backend",
    privs = {server=true}, -- Nur für Admins
    func = function(name, param)
        minetest.chat_send_player(name, "Teste Verbindung...")
        check_connection(name)
        return true
    end,
})