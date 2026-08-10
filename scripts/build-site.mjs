import { mkdir, readFile, writeFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/styles.css", import.meta.url), "utf8");
const ogImage = await readFile(new URL("../assets/og.png", import.meta.url));

const worker = `
const html = ${JSON.stringify(html)};
const css = ${JSON.stringify(css)};
const ogImageBase64 = ${JSON.stringify(ogImage.toString("base64"))};

const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

export default {
    async fetch(request) {
        const url = new URL(request.url);

        if (url.pathname === "/" || url.pathname === "/index.html") {
            return new Response(html, {
                headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
            });
        }

        if (url.pathname === "/assets/styles.css") {
            return new Response(css, {
                headers: {
                    ...headers,
                    "Content-Type": "text/css; charset=utf-8",
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        if (url.pathname === "/assets/og.png") {
            const binary = atob(ogImageBase64);
            const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
            return new Response(bytes, {
                headers: {
                    ...headers,
                    "Content-Type": "image/png",
                    "Cache-Control": "public, max-age=31536000, immutable",
                },
            });
        }

        return new Response("Not found", {
            status: 404,
            headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
        });
    },
};
`;

await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/server/index.js", import.meta.url), worker.trimStart());
