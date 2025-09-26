"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PT_Mono } from "next/font/google"
import { CalendarDays, Clock, ArrowUpRight, Check, Sparkle, Newspaper } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type BlogPost = {
  id: string
  title: string
  summary: string
  date: string
  source: string
  sourceUrl: string
  readingTime: string
  tags: string[]
  keyFacts: string[]
  content: string[]
}

interface BlogLandingProps {
  posts: BlogPost[]
}

const ptMono = PT_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
})

export function BlogLanding({ posts }: BlogLandingProps) {
  const [activePostId, setActivePostId] = useState(posts[0]?.id)

  const activePost = useMemo(() => {
    return posts.find((post) => post.id === activePostId) ?? posts[0]
  }, [posts, activePostId])

  if (!activePost) {
    return null
  }

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(value))
    } catch (error) {
      return value
    }
  }

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-white text-slate-900", ptMono.className)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/30 blur-[140px]" />
        <div className="absolute right-[-160px] top-1/3 h-[320px] w-[320px] rounded-full bg-cyan-400/20 blur-[160px]" />
        <div className="absolute left-[-120px] top-1/2 h-[280px] w-[280px] rounded-full bg-emerald-400/10 blur-[160px]" />
      </div>

      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-600 hover:text-emerald-700">
            DataTrace
          </Link>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-slate-600">
            <Link href="/" className="hover:text-emerald-600">
              Главная
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1 text-emerald-700">
              <Newspaper className="h-3.5 w-3.5" /> Блог
            </span>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-gray-200">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[3fr_2fr] lg:items-end">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-50 px-4 py-1 text-xs uppercase tracking-[0.4em] text-emerald-700">
                <Sparkle className="h-3.5 w-3.5" /> хроника утечек
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Блог DataTrace о публичных инцидентах безопасности
              </h1>
              <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
                Мы документируем только открытые случаи утечек без публикации персональных данных. Каждый обзор описывает, где появилось сообщение, какие риски это несёт бизнесу и как их снижают команды безопасности.
              </p>
            </div>
            <div className="space-y-5 rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Что внутри подборки
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  Подборка заметных публичных сообщений о компрометации данных за последние недели.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  Короткая сводка с ключевыми фактами и ссылками на источники.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  Практические рекомендации для реагирования и предотвращения повторных утечек.
                </li>
              </ul>
              <div className="rounded-2xl border border-emerald-500 bg-emerald-50 p-4 text-xs uppercase tracking-[0.3em] text-emerald-700">
                Скоро добавим генерацию и обновление ленты через Perplexity API.
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-600">Последние заметки</p>
                <p className="mt-3 text-sm text-slate-700">
                  Выберите публикацию, чтобы открыть подробный обзор, включая хронологию, подтвержденные факты и рекомендации.
                </p>
              </div>
              <div className="space-y-4">
                {posts.map((post) => {
                  const isActive = post.id === activePost.id

                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setActivePostId(post.id)}
                      className={cn(
                        "group w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50",
                        isActive && "border-emerald-500 bg-emerald-50 shadow-lg"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                        <span>{formatDate(post.date)}</span>
                        <span>{post.readingTime}</span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900">{post.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-emerald-500 bg-emerald-100 text-[10px] uppercase tracking-[0.35em] text-emerald-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <article className="space-y-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-600" /> {formatDate(activePost.date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" /> {activePost.readingTime}
                </span>
                <Link
                  href={activePost.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                >
                  {activePost.source}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-slate-900 lg:text-4xl">{activePost.title}</h2>
                <p className="text-base text-slate-600 lg:text-lg">{activePost.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {activePost.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-emerald-500 bg-emerald-100 text-[11px] uppercase tracking-[0.35em] text-emerald-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <ul className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-slate-700">
                {activePost.keyFacts.map((fact) => (
                  <li key={fact} className="flex items-start gap-3">
                    <span className="mt-1 rounded-full bg-emerald-100 p-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-5 text-base leading-relaxed text-slate-700">
                {activePost.content.map((paragraph, index) => (
                  <p key={`${activePost.id}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </div>

              <div className="rounded-2xl border border-emerald-500 bg-emerald-50 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">Следите за обновлениями</p>
                    <p className="mt-2 max-w-xl text-sm text-slate-700">
                      Подпишитесь на обновления DataTrace, чтобы первыми получать уведомления о новых расследованиях и публичных утечках.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="h-12 rounded-full border border-emerald-600 bg-emerald-600 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-emerald-700"
                  >
                    <Link href="/register">подписаться</Link>
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default BlogLanding
