import { CategoryCard } from "./CategoryCard";
import {
  collectSubtreeIds,
  flattenTree,
  type CategoryNode,
} from "@/lib/categories";
import {
  countClassifiedItems,
  countItemsInCategoryIds,
  type CategorizedItem,
} from "@/lib/category-counts";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";

interface CategoryIndexPageProps<TItem extends CategorizedItem> {
  title: string;
  terminalPath: string;
  description: string;
  status: string;
  categoryBasePath: string;
  items: TItem[];
  tree: CategoryNode[];
  classifiedPad: number;
}

export function CategoryIndexPage<TItem extends CategorizedItem>({
  title,
  terminalPath,
  description,
  status,
  categoryBasePath,
  items,
  tree,
  classifiedPad,
}: CategoryIndexPageProps<TItem>) {
  const allNodes = flattenTree(tree);
  const totalClassified = countClassifiedItems(items);
  const countForNode = (node: CategoryNode) =>
    countItemsInCategoryIds(items, collectSubtreeIds(node));

  return (
    <>
      <LabBackground />
      <Navigation />
      <section className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
                {terminalPath}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GlitchTitle text={title} />

            <p className="font-mono text-sm tracking-wider text-muted mt-6">
              {description}
            </p>

            <div className="flex items-center gap-4 mt-8 font-mono text-[10px] text-muted tracking-wider">
              <span>TOPICS: {String(allNodes.length).padStart(3, "0")}</span>
              <span>|</span>
              <span>
                CLASSIFIED:{" "}
                {String(totalClassified).padStart(classifiedPad, "0")}/
                {String(items.length).padStart(classifiedPad, "0")}
              </span>
              <span>|</span>
              <span>STATUS: {status}</span>
            </div>
          </div>

          {/* Top-level category grid */}
          {tree.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tree.map((node, i) => (
                <CategoryCard
                  key={node.id}
                  node={node}
                  basePath={categoryBasePath}
                  count={countForNode(node)}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 p-12 text-center">
              <p className="font-mono text-sm text-muted tracking-wider">
                NO CATEGORIES YET — AWAITING INPUT
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
