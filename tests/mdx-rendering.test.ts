import assert from "node:assert/strict";
import test from "node:test";
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  BLOG_PROSE_CLASS,
  PROJECT_PROSE_CLASS,
  CODE_BLOCK_PROSE_CLASS,
  SHARED_PROSE_CLASS,
  decodeMermaidMdxProps,
  mdxRemoteOptions,
  projectTableMdxComponents,
  sharedMdxComponents,
} from "../src/components/mdx/mdx-rendering";

test("decodeMermaidMdxProps preserves direct code props", () => {
  const chart = Buffer.from("graph TD\nA-->B", "utf-8").toString("base64");

  assert.equal(
    decodeMermaidMdxProps({ code: "sequenceDiagram\nA->>B: hi", chart }),
    "sequenceDiagram\nA->>B: hi"
  );
});

test("decodeMermaidMdxProps decodes Notion base64 chart props", () => {
  const source = "graph TD\nA-->B";
  const chart = Buffer.from(source, "utf-8").toString("base64");

  assert.equal(decodeMermaidMdxProps({ chart }), source);
  assert.equal(decodeMermaidMdxProps({ chart: 42 }), "");
});

test("shared MDX components keep the common blog/project mapping surface", () => {
  assert.deepEqual(Object.keys(sharedMdxComponents), [
    "CyberChart",
    "Mermaid",
    "pre",
    "code",
    "img",
    "table",
  ]);
  assert.deepEqual(Object.keys(projectTableMdxComponents), [
    "thead",
    "th",
    "td",
    "tr",
  ]);
});

test("remote MDX options keep the existing plugin stack", () => {
  const { remarkPlugins, rehypePlugins } = mdxRemoteOptions.mdxOptions;
  const prettyCode = rehypePlugins[2] as [unknown, { theme: string }];

  assert.equal(remarkPlugins.length, 2);
  assert.equal(rehypePlugins.length, 3);
  assert.equal(prettyCode[1].theme, "vitesse-dark");
});

test("prose classes preserve blog-only and project-only styling boundaries", () => {
  assert.equal(PROJECT_PROSE_CLASS, `${SHARED_PROSE_CLASS} ${CODE_BLOCK_PROSE_CLASS}`);
  assert.ok(BLOG_PROSE_CLASS.startsWith(`${SHARED_PROSE_CLASS} `));
  assert.ok(BLOG_PROSE_CLASS.endsWith(CODE_BLOCK_PROSE_CLASS));
  assert.match(BLOG_PROSE_CLASS, /\[&_figure_img\]:w-full/);
  assert.doesNotMatch(PROJECT_PROSE_CLASS, /\[&_figure_img\]:w-full/);
});

function renderSharedMdxImage(props: ComponentPropsWithoutRef<"img">) {
  const figure = sharedMdxComponents.img(props);
  assert.ok(isValidElement(figure));
  return figure as ReactElement<{ children?: ReactNode }>;
}

test("MDX image renderer keeps missing alt text decorative", () => {
  const figure = renderSharedMdxImage({ src: "/diagram.png" });
  const [image] = Children.toArray(figure.props.children);

  assert.ok(isValidElement(image));
  assert.equal(
    (image as ReactElement<ComponentPropsWithoutRef<"img">>).props.alt,
    ""
  );
});

test("MDX image renderer keeps alt text as the visible caption", () => {
  const figure = renderSharedMdxImage({
    src: "/diagram.png",
    alt: "State diagram",
  });
  const [, caption] = Children.toArray(figure.props.children);

  assert.ok(isValidElement(caption));
  assert.equal(
    (caption as ReactElement<{ children?: ReactNode }>).props.children,
    "State diagram"
  );
});
