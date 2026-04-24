import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { CodeBlock } from "../blog/CodeBlock";
import { CyberChart } from "../blog/CyberChart";
import { MermaidDiagram } from "../blog/MermaidDiagram";

type CyberChartMdxProps = {
  data?: string;
  type?: "linear" | "monotone" | "stepBefore" | "stepAfter";
  yScale?: "linear" | "log";
};

type MermaidMdxProps = {
  code?: unknown;
  chart?: unknown;
};

export const mdxRemoteOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      rehypeKatex,
      [rehypePrettyCode, { theme: "vitesse-dark" }],
    ],
  },
} satisfies NonNullable<MDXRemoteProps["options"]>;

export const SHARED_PROSE_CLASS =
  "prose prose-neutral max-w-none overflow-hidden text-black/90 leading-[1.85] text-base md:text-lg [&_p]:mb-5 [&_p]:mt-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-14 [&_h1]:mb-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-14 [&_h2]:mb-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-10 [&_h3]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:italic [&_blockquote]:text-muted [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-black [&_ul]:my-5 [&_ul]:space-y-2 [&_li]:text-black/80";

export const CODE_BLOCK_PROSE_CLASS =
  "[&_pre]:bg-[#121212] [&_pre]:text-white/90 [&_pre]:p-4 [&_pre]:md:p-5 [&_pre]:my-8 [&_pre]:md:my-10 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:md:text-sm [&_pre]:shadow-lg [&_pre]:leading-relaxed [&_pre]:tracking-wide [&_pre]:max-w-full";

export const BLOG_PROSE_CLASS = `${SHARED_PROSE_CLASS} [&_.math-block]:my-8 [&_.math-block]:text-center [&_.table-wrap]:my-8 [&_.table-wrap]:overflow-x-auto [&_.table-wrap]:-mx-5 [&_.table-wrap]:px-5 [&_table]:min-w-[600px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:text-left [&_th]:px-4 [&_th]:py-3 [&_th]:border-b [&_th]:border-black/20 [&_th]:text-black [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-black/10 [&_td]:align-top [&_figure]:my-10 [&_figure_img]:w-full [&_figure_img]:rounded [&_figure_img]:border [&_figure_img]:border-black/10 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted [&_figcaption]:mt-3 [&_figcaption]:font-mono [&_figcaption]:tracking-wide ${CODE_BLOCK_PROSE_CLASS}`;

export const PROJECT_PROSE_CLASS = `${SHARED_PROSE_CLASS} ${CODE_BLOCK_PROSE_CLASS}`;

export function decodeMermaidMdxProps(props: MermaidMdxProps): string {
  if (typeof props.code === "string") return props.code;
  if (typeof props.chart === "string") {
    return Buffer.from(props.chart, "base64").toString("utf-8");
  }
  return "";
}

function CyberChartMdx(props: CyberChartMdxProps) {
  return (
    <CyberChart
      dataString={props.data}
      type={props.type || "stepAfter"}
      yScale={props.yScale || "linear"}
    />
  );
}

function MermaidMdx(props: MermaidMdxProps) {
  // Notion→MDX converter emits <Mermaid chart="<base64>" />. Decode
  // server-side so the client component only receives plain diagram text.
  return <MermaidDiagram code={decodeMermaidMdxProps(props)} />;
}

function PreMdx(props: ComponentPropsWithoutRef<"pre">) {
  return <CodeBlock {...props} />;
}

function CodeMdx({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function ImageMdx(props: ComponentPropsWithoutRef<"img">) {
  return (
    <figure className="my-10">
      <img {...props} className="w-full rounded border border-black/10" />
      {props.alt && (
        <figcaption className="text-center text-sm text-muted mt-3 font-mono tracking-wide">
          {props.alt}
        </figcaption>
      )}
    </figure>
  );
}

function TableMdx(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="table-wrap my-8 overflow-x-auto -mx-5 px-5">
      <table
        className="min-w-[600px] w-full border-collapse text-sm"
        {...props}
      />
    </div>
  );
}

function ProjectTableHeadMdx(props: ComponentPropsWithoutRef<"thead">) {
  return <thead className="border-b border-black/20" {...props} />;
}

function ProjectTableHeaderMdx({
  align,
  ...rest
}: ComponentPropsWithoutRef<"th"> & { align?: CSSProperties["textAlign"] }) {
  return (
    <th
      className="py-2 pr-6 text-left align-top font-semibold text-black whitespace-nowrap"
      style={align ? { textAlign: align } : undefined}
      {...rest}
    />
  );
}

function ProjectTableCellMdx({
  align,
  ...rest
}: ComponentPropsWithoutRef<"td"> & { align?: CSSProperties["textAlign"] }) {
  return (
    <td
      className="py-2 pr-6 text-left align-top text-black/85"
      style={align ? { textAlign: align } : undefined}
      {...rest}
    />
  );
}

function ProjectTableRowMdx(props: ComponentPropsWithoutRef<"tr">) {
  return <tr className="border-b border-black/5 last:border-0" {...props} />;
}

export const sharedMdxComponents = {
  CyberChart: CyberChartMdx,
  Mermaid: MermaidMdx,
  pre: PreMdx,
  code: CodeMdx,
  img: ImageMdx,
  table: TableMdx,
};

export const projectTableMdxComponents = {
  thead: ProjectTableHeadMdx,
  th: ProjectTableHeaderMdx,
  td: ProjectTableCellMdx,
  tr: ProjectTableRowMdx,
};
