import { Category } from "../generated/books.js"

const categories: Record<string, Category> = {
  fiction: Category.CATEGORY_FICTION,
  fantasy: Category.CATEGORY_FANTASY,
  science_fiction: Category.CATEGORY_SCIENCE_FICTION,
  mystery: Category.CATEGORY_MYSTERY,
  thriller: Category.CATEGORY_THRILLER,
  romance: Category.CATEGORY_ROMANCE,
  horror: Category.CATEGORY_HORROR,
  adventure: Category.CATEGORY_ADVENTURE,
  history: Category.CATEGORY_HISTORY,
  biography: Category.CATEGORY_BIOGRAPHY,
  science: Category.CATEGORY_SCIENCE,
  technology: Category.CATEGORY_TECHNOLOGY,
  self_help: Category.CATEGORY_SELF_HELP,
  children: Category.CATEGORY_CHILDREN,
  comics: Category.CATEGORY_COMICS,
}

const names = new Map(Object.entries(categories).map(([name, category]) => [category, name]))

export const categoryNames = Object.keys(categories) as [string, ...string[]]

export function categoryFromName(name: string): Category | undefined {
  return categories[name]
}

export function categoryToName(category: Category): string {
  return names.get(category) ?? "unspecified"
}
