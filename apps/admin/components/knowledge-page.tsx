"use client";

import type {
  ApiResponse,
  FaqItem,
  KnowledgeArticle,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeStatus,
} from "@wuliuqi/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@wuliuqi/ui/components/alert-dialog";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wuliuqi/ui/components/dialog";
import { Input } from "@wuliuqi/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wuliuqi/ui/components/select";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@wuliuqi/ui/components/tabs";
import { Textarea } from "@wuliuqi/ui/components/textarea";
import {
  BookOpen,
  CircleHelp,
  FolderTree,
  Pencil,
  RefreshCw,
  Rocket,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type KnowledgeState = {
  bases: KnowledgeBase[];
  categories: KnowledgeCategory[];
  articles: KnowledgeArticle[];
  faqs: FaqItem[];
};

type ContentType = "article" | "faq";
type KnowledgeContentItem = KnowledgeArticle | FaqItem;
type ContentTarget = {
  type: ContentType;
  item: KnowledgeContentItem;
};
type EditingContent = ContentTarget;
type DeleteTarget = ContentTarget;
type PendingActionName =
  | "create-base"
  | "create-category"
  | "create-article"
  | "create-faq"
  | "update"
  | "publish"
  | "reindex"
  | "delete";
type PendingAction = {
  name: PendingActionName;
  sourceId?: string;
  sourceType?: ContentType;
};
type MutateMessages = {
  failure: string;
  success: string;
};
type ContentFilters = {
  categoryId: string;
  query: string;
};

const initialState: KnowledgeState = {
  bases: [],
  categories: [],
  articles: [],
  faqs: [],
};
const initialContentFilters: ContentFilters = {
  categoryId: "__all",
  query: "",
};

async function requestJson<T>(
  url: string,
  init: RequestInit & { body?: BodyInit | null } = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function contentTypeLabel(type: ContentType) {
  return type === "article" ? "文章" : "FAQ";
}

function isPendingAction(
  pendingAction: PendingAction | null,
  name: PendingActionName,
  sourceType?: ContentType,
  sourceId?: string,
) {
  if (!pendingAction || pendingAction.name !== name) {
    return false;
  }

  if (sourceType && pendingAction.sourceType !== sourceType) {
    return false;
  }

  if (sourceId && pendingAction.sourceId !== sourceId) {
    return false;
  }

  return true;
}

export function KnowledgePage() {
  const [state, setState] = useState<KnowledgeState>(initialState);
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editing, setEditing] = useState<EditingContent | null>(null);
  const [articleFilters, setArticleFilters] = useState<ContentFilters>(
    initialContentFilters,
  );
  const [faqFilters, setFaqFilters] = useState<ContentFilters>(
    initialContentFilters,
  );
  const isMutating = pendingAction !== null;
  const selectedBase = useMemo(
    () => state.bases.find((base) => base.id === selectedBaseId),
    [selectedBaseId, state.bases],
  );
  const filteredArticles = useMemo(
    () => filterArticles(state.articles, articleFilters),
    [articleFilters, state.articles],
  );
  const filteredFaqs = useMemo(
    () => filterFaqs(state.faqs, faqFilters),
    [faqFilters, state.faqs],
  );

  async function loadBases() {
    setLoading(true);

    try {
      const bases = await requestJson<KnowledgeBase[]>("/api/knowledge/bases");
      setState((current) => ({ ...current, bases }));
      setSelectedBaseId((current) => current || bases[0]?.id || "");
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载失败"));
    } finally {
      setLoading(false);
    }
  }

  async function loadBaseChildren(baseId: string) {
    if (!baseId) {
      return;
    }

    setLoading(true);

    try {
      const [categories, articles, faqs] = await Promise.all([
        requestJson<KnowledgeCategory[]>(
          `/api/knowledge/bases/${baseId}/categories`,
        ),
        requestJson<KnowledgeArticle[]>(`/api/knowledge/bases/${baseId}/articles`),
        requestJson<FaqItem[]>(`/api/knowledge/bases/${baseId}/faqs`),
      ]);
      setState((current) => ({ ...current, categories, articles, faqs }));
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载失败"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBases();
  }, []);

  useEffect(() => {
    setArticleFilters(initialContentFilters);
    setFaqFilters(initialContentFilters);
    void loadBaseChildren(selectedBaseId);
  }, [selectedBaseId]);

  async function createBase(formData: FormData) {
    await mutate(
      { name: "create-base" },
      async () => {
        await requestJson<KnowledgeBase>("/api/knowledge/bases", {
          method: "POST",
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            slug: String(formData.get("slug") ?? ""),
            description: String(formData.get("description") ?? ""),
            status: "published",
            visibility: "public",
          }),
        });
        await loadBases();
      },
      { failure: "创建知识库失败", success: "知识库已创建" },
    );
  }

  async function createCategory(formData: FormData) {
    if (!selectedBaseId) {
      return;
    }

    await mutate(
      { name: "create-category" },
      async () => {
        await requestJson<KnowledgeCategory>(
          `/api/knowledge/bases/${selectedBaseId}/categories`,
          {
            method: "POST",
            body: JSON.stringify({
              name: String(formData.get("name") ?? ""),
              slug: String(formData.get("slug") ?? ""),
              description: String(formData.get("description") ?? ""),
              sortOrder: Number(formData.get("sortOrder") || 0),
            }),
          },
        );
        await loadBaseChildren(selectedBaseId);
      },
      { failure: "创建分类失败", success: "分类已创建" },
    );
  }

  async function createArticle(formData: FormData) {
    if (!selectedBaseId) {
      return;
    }

    await mutate(
      { name: "create-article" },
      async () => {
        await requestJson<KnowledgeArticle>(
          `/api/knowledge/bases/${selectedBaseId}/articles`,
          {
            method: "POST",
            body: JSON.stringify({
              categoryId: cleanCategoryId(formData.get("categoryId")),
              title: String(formData.get("title") ?? ""),
              slug: String(formData.get("slug") ?? ""),
              excerpt: String(formData.get("excerpt") ?? ""),
              content: String(formData.get("content") ?? ""),
              status: String(formData.get("status") ?? "draft"),
              tags: String(formData.get("tags") ?? ""),
              sortOrder: Number(formData.get("sortOrder") || 0),
            }),
          },
        );
        await loadBaseChildren(selectedBaseId);
      },
      { failure: "创建文章失败", success: "文章已创建" },
    );
  }

  async function createFaq(formData: FormData) {
    if (!selectedBaseId) {
      return;
    }

    await mutate(
      { name: "create-faq" },
      async () => {
        await requestJson<FaqItem>(`/api/knowledge/bases/${selectedBaseId}/faqs`, {
          method: "POST",
          body: JSON.stringify({
            categoryId: cleanCategoryId(formData.get("categoryId")),
            question: String(formData.get("question") ?? ""),
            answer: String(formData.get("answer") ?? ""),
            aliases: String(formData.get("aliases") ?? ""),
            status: String(formData.get("status") ?? "draft"),
            tags: String(formData.get("tags") ?? ""),
            sortOrder: Number(formData.get("sortOrder") || 0),
          }),
        });
        await loadBaseChildren(selectedBaseId);
      },
      { failure: "创建 FAQ 失败", success: "FAQ 已创建" },
    );
  }

  async function updateContent(editingContent: EditingContent, formData: FormData) {
    const typeLabel = contentTypeLabel(editingContent.type);

    await mutate(
      {
        name: "update",
        sourceId: editingContent.item.id,
        sourceType: editingContent.type,
      },
      async () => {
        await requestJson<KnowledgeContentItem>(
          contentUrl(editingContent.type, editingContent.item.id),
          {
            method: "PATCH",
            body: JSON.stringify(contentPayload(editingContent.type, formData)),
          },
        );
        await loadBaseChildren(selectedBaseId);
        setEditing(null);
      },
      { failure: `更新${typeLabel}失败`, success: `${typeLabel}已保存` },
    );
  }

  async function publishContent(sourceType: ContentType, sourceId: string) {
    const typeLabel = contentTypeLabel(sourceType);

    await mutate(
      { name: "publish", sourceId, sourceType },
      async () => {
        await requestJson<KnowledgeContentItem>(contentUrl(sourceType, sourceId), {
          method: "PATCH",
          body: JSON.stringify({ status: "published" }),
        });
        await loadBaseChildren(selectedBaseId);
      },
      { failure: `发布${typeLabel}失败`, success: `${typeLabel}已发布` },
    );
  }

  async function reindex(sourceType: ContentType, sourceId: string) {
    const typeLabel = contentTypeLabel(sourceType);

    await mutate(
      { name: "reindex", sourceId, sourceType },
      async () => {
        await requestJson(`/api/knowledge/index/${sourceType}/${sourceId}`, {
          method: "POST",
        });
        await loadBaseChildren(selectedBaseId);
      },
      { failure: `重建${typeLabel}索引失败`, success: `${typeLabel}索引已重建` },
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const activeTarget = deleteTarget;
    const typeLabel = contentTypeLabel(activeTarget.type);

    await mutate(
      {
        name: "delete",
        sourceId: activeTarget.item.id,
        sourceType: activeTarget.type,
      },
      async () => {
        await requestJson(contentUrl(activeTarget.type, activeTarget.item.id), {
          method: "DELETE",
        });
        setDeleteTarget(null);
        await loadBaseChildren(selectedBaseId);
      },
      { failure: `删除${typeLabel}失败`, success: `${typeLabel}已删除` },
    );
  }

  async function mutate(
    action: PendingAction,
    task: () => Promise<void>,
    messages: MutateMessages,
  ) {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);

    try {
      await task();
      toast.success(messages.success);
    } catch (mutateError) {
      toast.error(errorMessage(mutateError, messages.failure));
    } finally {
      setPendingAction(null);
    }
  }

  const editingSaving = editing
    ? isPendingAction(pendingAction, "update", editing.type, editing.item.id)
    : false;
  const deletePending = deleteTarget
    ? isPendingAction(pendingAction, "delete", deleteTarget.type, deleteTarget.item.id)
    : false;
  const deleteTypeLabel = deleteTarget
    ? contentTypeLabel(deleteTarget.type)
    : "内容";
  const deleteTitle = deleteTarget ? contentTitle(deleteTarget.item) : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">知识库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理买家帮助中心内容、FAQ 和 RAG 索引。
          </p>
        </div>
        <Button disabled={loading || isMutating} variant="outline" onClick={loadBases}>
          {loading ? <Spinner /> : <RefreshCw size={16} />}
          刷新
        </Button>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle className="text-base">知识库设置</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(240px,360px)_1fr]">
          <div className="space-y-3">
            <Select value={selectedBaseId} onValueChange={setSelectedBaseId}>
              <SelectTrigger>
                <SelectValue placeholder="选择知识库" />
              </SelectTrigger>
              <SelectContent>
                {state.bases.map((base) => (
                  <SelectItem key={base.id} value={base.id}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBase ? (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="font-medium">{selectedBase.name}</div>
                <div className="mt-1 text-muted-foreground">
                  /kb/{selectedBase.slug}
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">{selectedBase.visibility}</Badge>
                  <Badge variant="secondary">{selectedBase.status}</Badge>
                </div>
              </div>
            ) : null}
          </div>
          <form action={createBase} className="grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="知识库名称，如 买家帮助中心" />
            <Input name="slug" placeholder="路径标识，如 buyer-help" />
            <Input
              className="sm:col-span-2"
              name="description"
              placeholder="描述"
            />
            <Button className="sm:col-span-2" disabled={isMutating} type="submit">
              {isPendingAction(pendingAction, "create-base") ? <Spinner /> : null}
              新建知识库
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="categories">
            <FolderTree size={15} />
            分类
          </TabsTrigger>
          <TabsTrigger value="articles">
            <BookOpen size={15} />
            文章
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <CircleHelp size={15} />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">分类管理</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <form action={createCategory} className="space-y-3">
                <Input name="name" placeholder="分类名称" />
                <Input name="slug" placeholder="路径标识，如 login" />
                <Input name="description" placeholder="分类描述" />
                <Input name="sortOrder" placeholder="排序值" type="number" />
                <Button disabled={isMutating || !selectedBaseId} type="submit">
                  {isPendingAction(pendingAction, "create-category") ? (
                    <Spinner />
                  ) : null}
                  新建分类
                </Button>
              </form>
              <div className="grid gap-2">
                {state.categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-md border border-border bg-card p-3"
                  >
                    <div className="font-medium">{category.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {category.slug} · 排序 {category.sortOrder}
                    </div>
                    {category.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="mt-4">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">文章管理</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[420px_1fr]">
              <form action={createArticle} className="space-y-3">
                <Input name="title" placeholder="文章标题" />
                <Input name="slug" placeholder="路径标识，如 login-failed" />
                <CategorySelect categories={state.categories} />
                <Input name="excerpt" placeholder="摘要" />
                <Input name="tags" placeholder="标签，用逗号分隔" />
                <Input name="sortOrder" placeholder="排序值" type="number" />
                <StatusSelect />
                <Textarea
                  className="min-h-56"
                  name="content"
                  placeholder="Markdown 内容"
                />
                <Button disabled={isMutating || !selectedBaseId} type="submit">
                  {isPendingAction(pendingAction, "create-article") ? (
                    <Spinner />
                  ) : null}
                  新建文章
                </Button>
              </form>
              <div className="space-y-3">
                <ContentFilterToolbar
                  categories={state.categories}
                  filters={articleFilters}
                  placeholder="搜索标题、摘要或正文"
                  totalCount={state.articles.length}
                  visibleCount={filteredArticles.length}
                  onChange={setArticleFilters}
                />
                <ContentList
                  emptyMessage={
                    state.articles.length === 0 ? "暂无内容" : "没有匹配内容"
                  }
                  items={filteredArticles}
                  type="article"
                  onDelete={(type, item) => setDeleteTarget({ type, item })}
                  onEdit={(type, item) => setEditing({ type, item })}
                  onPublish={publishContent}
                  onReindex={reindex}
                  pendingAction={pendingAction}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="mt-4">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">FAQ 管理</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[420px_1fr]">
              <form action={createFaq} className="space-y-3">
                <Input name="question" placeholder="问题" />
                <CategorySelect categories={state.categories} />
                <Input name="aliases" placeholder="相似问法，用逗号分隔" />
                <Input name="tags" placeholder="标签，用逗号分隔" />
                <Input name="sortOrder" placeholder="排序值" type="number" />
                <StatusSelect />
                <Textarea
                  className="min-h-40"
                  name="answer"
                  placeholder="标准答案"
                />
                <Button disabled={isMutating || !selectedBaseId} type="submit">
                  {isPendingAction(pendingAction, "create-faq") ? <Spinner /> : null}
                  新建 FAQ
                </Button>
              </form>
              <div className="space-y-3">
                <ContentFilterToolbar
                  categories={state.categories}
                  filters={faqFilters}
                  placeholder="搜索问题或答案"
                  totalCount={state.faqs.length}
                  visibleCount={filteredFaqs.length}
                  onChange={setFaqFilters}
                />
                <ContentList
                  emptyMessage={
                    state.faqs.length === 0 ? "暂无内容" : "没有匹配内容"
                  }
                  items={filteredFaqs}
                  type="faq"
                  onDelete={(type, item) => setDeleteTarget({ type, item })}
                  onEdit={(type, item) => setEditing({ type, item })}
                  onPublish={publishContent}
                  onReindex={reindex}
                  pendingAction={pendingAction}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <KnowledgeEditDialog
        categories={state.categories}
        editing={editing}
        saving={editingSaving}
        onClose={() => setEditing(null)}
        onSubmit={updateContent}
      />
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除{deleteTypeLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除{deleteTypeLabel}“{deleteTitle}”？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePending ? <Spinner /> : null}
              删除{deleteTypeLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function contentUrl(type: ContentType, id: string) {
  return type === "article"
    ? `/api/knowledge/articles/${id}`
    : `/api/knowledge/faqs/${id}`;
}

function contentPayload(type: ContentType, formData: FormData) {
  if (type === "article") {
    return {
      categoryId: cleanCategoryId(formData.get("categoryId")),
      title: formValue(formData, "title"),
      slug: formValue(formData, "slug"),
      excerpt: formValue(formData, "excerpt"),
      content: formValue(formData, "content"),
      status: formValue(formData, "status"),
      tags: formValue(formData, "tags"),
      sortOrder: Number(formData.get("sortOrder") || 0),
    };
  }

  return {
    categoryId: cleanCategoryId(formData.get("categoryId")),
    question: formValue(formData, "question"),
    answer: formValue(formData, "answer"),
    aliases: formValue(formData, "aliases"),
    status: formValue(formData, "status"),
    tags: formValue(formData, "tags"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  };
}

function formValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesCategoryFilter(
  item: KnowledgeContentItem,
  categoryId: string,
) {
  if (categoryId === "__all") {
    return true;
  }

  if (categoryId === "__none") {
    return !item.categoryId;
  }

  return item.categoryId === categoryId;
}

function containsQuery(fields: Array<string | null | undefined>, query: string) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) =>
    String(field ?? "")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function filterArticles(
  articles: KnowledgeArticle[],
  filters: ContentFilters,
) {
  return articles.filter(
    (article) =>
      matchesCategoryFilter(article, filters.categoryId) &&
      containsQuery([article.title, article.excerpt, article.content], filters.query),
  );
}

function filterFaqs(faqs: FaqItem[], filters: ContentFilters) {
  return faqs.filter(
    (faq) =>
      matchesCategoryFilter(faq, filters.categoryId) &&
      containsQuery([faq.question, faq.answer], filters.query),
  );
}

function contentTitle(item: KnowledgeContentItem) {
  return "title" in item ? item.title : item.question;
}

function contentSubtitle(item: KnowledgeContentItem) {
  return "slug" in item ? item.slug : item.answer;
}

function CategorySelect({
  categories,
  defaultValue = "__none",
}: {
  categories: KnowledgeCategory[];
  defaultValue?: string;
}) {
  return (
    <Select defaultValue={defaultValue} name="categoryId">
      <SelectTrigger>
        <SelectValue placeholder="选择分类，可不选" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">不选择分类</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function cleanCategoryId(value: FormDataEntryValue | null) {
  const categoryId = String(value ?? "");

  return categoryId && categoryId !== "__none" ? categoryId : undefined;
}

function ContentFilterToolbar({
  categories,
  filters,
  onChange,
  placeholder,
  totalCount,
  visibleCount,
}: {
  categories: KnowledgeCategory[];
  filters: ContentFilters;
  onChange: (filters: ContentFilters) => void;
  placeholder: string;
  totalCount: number;
  visibleCount: number;
}) {
  const hasFilters =
    filters.query.trim().length > 0 || filters.categoryId !== "__all";

  function updateFilter(nextFilters: Partial<ContentFilters>) {
    onChange({ ...filters, ...nextFilters });
  }

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={placeholder}
            value={filters.query}
            onChange={(event) => updateFilter({ query: event.target.value })}
          />
        </div>
        <Select
          value={filters.categoryId}
          onValueChange={(categoryId) => updateFilter({ categoryId })}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">全部分类</SelectItem>
            <SelectItem value="__none">未分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(initialContentFilters)}
          >
            <X size={16} />
            清空筛选
          </Button>
        ) : null}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        显示 {visibleCount} / {totalCount}
      </div>
    </div>
  );
}

function StatusSelect({ defaultValue = "draft" }: { defaultValue?: KnowledgeStatus }) {
  return (
    <Select defaultValue={defaultValue} name="status">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">草稿</SelectItem>
        <SelectItem value="published">发布并索引</SelectItem>
        <SelectItem value="archived">归档</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ContentList({
  emptyMessage = "暂无内容",
  items,
  onDelete,
  onEdit,
  onPublish,
  onReindex,
  pendingAction,
  type,
}: {
  emptyMessage?: string;
  items: KnowledgeContentItem[];
  onDelete: (type: ContentType, item: KnowledgeContentItem) => void;
  onEdit: (type: ContentType, item: KnowledgeContentItem) => void;
  onPublish: (type: ContentType, id: string) => Promise<void>;
  onReindex: (type: ContentType, id: string) => Promise<void>;
  pendingAction: PendingAction | null;
  type: ContentType;
}) {
  const typeLabel = contentTypeLabel(type);
  const isMutating = pendingAction !== null;

  return (
    <div className="grid gap-2">
      {items.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : null}
      {items.map((item) => {
        const title = contentTitle(item);
        const subtitle = contentSubtitle(item);
        const publishing = isPendingAction(
          pendingAction,
          "publish",
          type,
          item.id,
        );
        const reindexing = isPendingAction(
          pendingAction,
          "reindex",
          type,
          item.id,
        );
        const deleting = isPendingAction(pendingAction, "delete", type, item.id);

        return (
          <div
            key={item.id}
            className="rounded-md border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {subtitle}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  aria-label={`编辑${typeLabel}`}
                  disabled={isMutating}
                  size="icon"
                  title={`编辑${typeLabel}`}
                  type="button"
                  variant="ghost"
                  onClick={() => onEdit(type, item)}
                >
                  <Pencil size={15} />
                </Button>
                {item.status === "draft" ? (
                  <Button
                    aria-label={`发布${typeLabel}`}
                    disabled={isMutating}
                    size="icon"
                    title={`发布${typeLabel}`}
                    type="button"
                    variant="ghost"
                    onClick={() => onPublish(type, item.id)}
                  >
                    {publishing ? <Spinner /> : <Rocket size={15} />}
                  </Button>
                ) : null}
                <Button
                  aria-label={`重建${typeLabel}索引`}
                  disabled={isMutating}
                  size="icon"
                  title={`重建${typeLabel}索引`}
                  type="button"
                  variant="ghost"
                  onClick={() => onReindex(type, item.id)}
                >
                  {reindexing ? <Spinner /> : <RefreshCw size={15} />}
                </Button>
                <Button
                  aria-label={`删除${typeLabel}`}
                  disabled={isMutating}
                  size="icon"
                  title={`删除${typeLabel}`}
                  type="button"
                  variant="ghost"
                  onClick={() => onDelete(type, item)}
                >
                  {deleting ? <Spinner /> : <Trash2 size={15} />}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{item.status}</Badge>
              <Badge variant="secondary">{item.indexStatus}</Badge>
              {item.indexError ? (
                <Badge className="max-w-full truncate" variant="secondary">
                  {item.indexError}
                </Badge>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KnowledgeEditDialog({
  categories,
  editing,
  onClose,
  onSubmit,
  saving,
}: {
  categories: KnowledgeCategory[];
  editing: EditingContent | null;
  onClose: () => void;
  onSubmit: (editing: EditingContent, formData: FormData) => Promise<void>;
  saving: boolean;
}) {
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => {
    setLocalSaving(false);
  }, [editing?.item.id, editing?.type]);

  if (!editing) {
    return null;
  }

  const activeEditing = editing;
  const typeLabel = activeEditing.type === "article" ? "文章" : "FAQ";
  const submitting = saving || localSaving;

  async function submit(formData: FormData) {
    if (submitting) {
      return;
    }

    setLocalSaving(true);

    try {
      await onSubmit(activeEditing, formData);
    } finally {
      setLocalSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    void submit(new FormData(event.currentTarget));
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-hidden p-0">
        <form
          key={`${activeEditing.type}-${activeEditing.item.id}`}
          aria-busy={submitting}
          className="flex max-h-[calc(100dvh-2rem)] flex-col"
          onSubmit={handleSubmit}
        >
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle>编辑{typeLabel}</DialogTitle>
            <DialogDescription className="sr-only">
              编辑知识库内容。
            </DialogDescription>
          </DialogHeader>
          <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
            {activeEditing.type === "article" ? (
              <ArticleEditFields
                article={activeEditing.item as KnowledgeArticle}
                categories={categories}
              />
            ) : (
              <FaqEditFields
                faq={activeEditing.item as FaqItem}
                categories={categories}
              />
            )}
          </div>
          <DialogFooter className="border-t border-border p-4">
            <Button
              disabled={submitting}
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? <Spinner /> : null}
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArticleEditFields({
  article,
  categories,
}: {
  article: KnowledgeArticle;
  categories: KnowledgeCategory[];
}) {
  return (
    <>
      <Input defaultValue={article.title} name="title" placeholder="文章标题" />
      <Input
        defaultValue={article.slug}
        name="slug"
        placeholder="路径标识，如 login-failed"
      />
      <CategorySelect
        categories={categories}
        defaultValue={article.categoryId ?? "__none"}
      />
      <Input
        defaultValue={article.excerpt ?? ""}
        name="excerpt"
        placeholder="摘要"
      />
      <Input
        defaultValue={article.tags.join(", ")}
        name="tags"
        placeholder="标签，用逗号分隔"
      />
      <Input
        defaultValue={article.sortOrder}
        name="sortOrder"
        placeholder="排序值"
        type="number"
      />
      <StatusSelect defaultValue={article.status} />
      <Textarea
        className="min-h-64 sm:col-span-2"
        defaultValue={article.content}
        name="content"
        placeholder="Markdown 内容"
      />
    </>
  );
}

function FaqEditFields({
  categories,
  faq,
}: {
  categories: KnowledgeCategory[];
  faq: FaqItem;
}) {
  return (
    <>
      <Input
        className="sm:col-span-2"
        defaultValue={faq.question}
        name="question"
        placeholder="问题"
      />
      <CategorySelect
        categories={categories}
        defaultValue={faq.categoryId ?? "__none"}
      />
      <StatusSelect defaultValue={faq.status} />
      <Input
        defaultValue={faq.aliases.join(", ")}
        name="aliases"
        placeholder="相似问法，用逗号分隔"
      />
      <Input
        defaultValue={faq.tags.join(", ")}
        name="tags"
        placeholder="标签，用逗号分隔"
      />
      <Input
        defaultValue={faq.sortOrder}
        name="sortOrder"
        placeholder="排序值"
        type="number"
      />
      <Textarea
        className="min-h-48 sm:col-span-2"
        defaultValue={faq.answer}
        name="answer"
        placeholder="标准答案"
      />
    </>
  );
}
