-- api.lua

function learning_core.query_api(endpoint, method, payload, callback)
    local url = learning_core.backend_url .. endpoint
    learning_core.http.fetch({
        url = url,
        method = method or "GET",
        timeout = 5,
        extra_headers = {
            "Content-Type: application/json",
            "Authorization: Bearer " .. learning_core.api_token
        },
        data = payload and minetest.write_json(payload) or nil
    }, function(res)
        if res.succeeded and res.code == 200 then
            local data = minetest.parse_json(res.data)
            if callback then callback(data) end
        end
    end)
end