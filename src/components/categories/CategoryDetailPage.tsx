import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryFilter } from "@/components/categories/CategoryFilter";
import type { CategoryNode } from "@/lib/categories";
import {
  buildCategoryCrumbs,
  getItemsInCategorySubtree,
  type CategoryDetailItem,
} from "@/lib/category-detail";

interface CategoryDetailPageProps<TItem extends CategoryDetailItem> {
  sectionPath: string;
  sectionLabel: string;
  categoryBasePath: string;
  roots: CategoryNode[];
  node: CategoryNode;
  slug: string[];
  allItems: TItem[];
  items: TItem[];
  maxWidthClassName: string;
  countLabel: string;
  listTitle: string;
  listClassName: string;
  emptyMessage: string;
  getItemKey: (item: TItem) => string;
  renderItem: (item: TItem, index: number) => ReactNode;
}

export function CategoryDetailPage<TItem extends CategoryDetailItem>({
  sectionPath,
  sectionLabel,
  categoryBasePath,
  roots,
  node,
  slug,
  allItems,
  items,
  maxWidthClassName,
  countLabel,
  listTitle,
  listClassName,
  emptyMessage,
  getItemKey,
  renderItem,
}: CategoryDetailPageProps<TItem>) {
  const crumbs = buildCategoryCrumbs(categoryBasePath, slug);
  const activeRootSlug = slug[0];

  return (
    <>
      <LabBackground />
      <Navigation />
      <section className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className={maxWidthClassName}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <Link
              href={sectionPath}
              className="shrink-0 hover:text-black transition-colors"
            >
              &gt; {sectionLabel}
            </Link>
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-x-2">
                <span className="shrink-0">/</span>
                {c.isLast ? (
                  <span className="text-black break-all">{c.seg}</span>
                ) : (
                  <Link
                    href={c.href}
                    className="shrink-0 hover:text-black transition-colors break-all"
                  >
                    {c.seg}
                  </Link>
                )}
              </span>
            ))}
          </div>

          <CategoryFilter
            basePath={sectionPath}
            categoryBase={categoryBasePath}
            roots={roots}
            activeSlug={activeRootSlug}
          />

          <header className="mb-16">
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted mb-4">
              &gt; CATEGORY
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight mb-6 leading-tight">
              {node.name}
            </h1>
            {node.description && (
              <p className="text-lg text-muted leading-relaxed mb-8 max-w-2xl">
                {node.description}
              </p>
            )}
            <div className="flex items-center gap-4 font-mono text-[10px] text-muted tracking-wider">
              <span>
                {countLabel}: {String(items.length).padStart(2, "0")}
              </span>
              {node.children.length > 0 && (
                <>
                  <span>|</span>
                  <span>SUB: {String(node.children.length).padStart(2, "0")}</span>
                </>
              )}
            </div>
            <div className="h-px w-full bg-border mt-8" />
          </header>

          {node.children.length > 0 && (
            <div className="mb-16">
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6">
                &gt; SUBCATEGORIES
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {node.children.map((child, i) => (
                  <CategoryCard
                    key={child.id}
                    node={child}
                    basePath={categoryBasePath}
                    count={getItemsInCategorySubtree(allItems, child).length}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6">
              &gt; {listTitle}
            </h2>
            {items.length > 0 ? (
              <div className={listClassName}>
                {items.map((item, i) => (
                  <Fragment key={getItemKey(item)}>
                    {renderItem(item, i)}
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className="border border-border/50 p-12 text-center">
                <p className="font-mono text-sm text-muted tracking-wider">
                  {emptyMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
