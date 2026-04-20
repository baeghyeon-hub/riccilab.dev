import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
        pathname: "/secure.notion-static.com/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow Giscus to fetch the custom theme
        source: "/giscus-theme.css",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/giscus-theme-light.css",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

// Same plugin stack as the runtime MDXRemote path in blog/[slug] and
// projects/[slug], so filesystem MDX (compiled at build time by @next/mdx)
// and Notion MDX (rendered at request time by next-mdx-remote) end up
// identically highlighted, slugified, and math-rendered. Without this,
// fs MDX code blocks render as unstyled plain text.
//
// Turbopack requires plugin options to be serializable, so we pass module
// paths as strings rather than imported function references — webpack also
// accepts this form. rehype-pretty-code gets its theme option inline.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // remark-frontmatter recognizes the leading YAML `---` block as a
    // yaml AST node rather than body text. Without it, @next/mdx treats
    // the first `---` as a thematic break and renders the frontmatter
    // lines as a paragraph at the top of the post. gray-matter already
    // extracts the same block server-side for metadata; this plugin just
    // ensures the MDX compiler also knows to skip it during rendering.
    remarkPlugins: [["remark-frontmatter", ["yaml"]], "remark-gfm", "remark-math"],
    rehypePlugins: [
      "rehype-slug",
      "rehype-katex",
      ["rehype-pretty-code", { theme: "vitesse-dark" }],
    ],
  },
});

export default withMDX(nextConfig);
