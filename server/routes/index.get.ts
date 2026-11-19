import { defineHandler } from "nitro";

export default defineHandler((event) => {
    return {
        message: "Halo from Nitro standalone!"
    };
});