import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const templates = [
  {
    slug: "dinosaur-discovery",
    title: "Dinosaur Discovery",
    category: "Matching Game",
    age: "4-7 Years",
    duration: "15 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdZXSZZdFxUzTIi-QxeEnSpapiFAb0XTX4_d5rnScIMO_H0eV75cXt4L3g2UmY84d6fI1e7FPsC8kPzTn7eg3NtbNtmlUEj_2W_HvcqEwqIBpA_jVJrMuUIgzB27wHMZecL9fphzgmCS1oPpD5ehk58ZqQWbR35GyPXztU9_Zwhjp3WY9Vch4YNQfWP91wqw9vMupGZOdcvSSxhCvcCFNPJRMko1p6e4o8ODCqrcPMMLhAq6dnJD5l9nvSgRCctwRoaBSbyqXzUtY",
  },
  {
    slug: "space-math-adventure",
    title: "Space Math Adventure",
    category: "Math Game",
    age: "8-12 Years",
    duration: "25 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBx1oKetx-Ja22fqUFu8_wZGxtvdeDCMw4ILAFZdqvT_HaAGZXsrXTViaGEDNPDasqPqVBbn-Td1K08yO6Bp1WYKqB0ZQnNBYb-UmtPRrEFvVkiKjEKs_jQlqgbuPksMc8zDVz_vH267MyADeDtelu_EX2AsSgt22PaJu4Hq2bqUbCpHI6Qwt4h6JEN85T4uu183LeztJ_WDtA6-Ps6IZnmE3XCATcmAvqKaIoe_eepx4PRofQMiEA5x90ox9lsbcNwcCyGUzbhWt8",
  },
  {
    slug: "epic-tale-weaver",
    title: "Epic Tale Weaver",
    category: "Story Builder",
    age: "13-16 Years",
    duration: "45 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAwdxYGpNngGkAjVWedFad179Vib1kS7_HZa8ChqkZYSEuIn8Tki6y6LfbfStTkBSwEGZE_neUOf7Lvq63Arc7ppzbP7_eoe98SOhsofaUWHGUzULW3kwJGMYNG2otTvWLnkOyE3sJmFg2EaGIagRS-7LJjMP4sznMk0U_S5wsZ-sPfz17NCDOnQaHO5GlIo_a0gIx2G11UFuf8TePbZJhs4SioGOdTCm_yacmHTD10QAb-hI-0LkcVF84-Lx0bTP6e4RvWcCj6D0",
  },
  {
    slug: "biology-lab-challenge",
    title: "Biology Lab Challenge",
    category: "MCQ Quiz",
    age: "13-16 Years",
    duration: "10 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4r_P1kQulPrEFxjzLME2xnovuPESqQwtWL6L8XU3H60TuxTjs9TTjKewJTnZLro4aQxMj9Z6-H8OD7b4I9grnFT95lXBlJquuT7eh9Y9QS6931hGehFmH1LVcr95rwmGaiU4Rx2vxMTsrhGVJ7A1ccI12attaYREUZ5MXj2_DFYM4OkmmMdrPCdwI1M8WA4hjhDkomOKOj04HnYnsT8FmRpPdASe9oj2IZ270B3gTXXVdEpn86KZup_JguInn80nvTKDFac_7E5A",
  },
  {
    slug: "coding-concepts",
    title: "Coding Concepts",
    category: "Flashcards",
    age: "8-12 Years",
    duration: "20 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBREMGSpgGnTsyVyBKIN990K5NzFfG9RxU0ssqdghNvCpwBXrYIxyW717K_eSyfp5FJq3ZNmtOI8ghR9EcKgSYzMcRD8Ar-gBsGA03ogszeUNZhNKBjcrGnJhkAzLK7vXdDPM-ar1eUiCp_PmUYm666vjVMUK3oNV2kiMoSMeTfLm0pO5g3N3GWNB8LiRHfYIiajzB3Q0pyvJfImEvaksXWI04KzK5D_2VUtM5ei1WGLDxvjx01x9cbY4asXRyCYE6Qb_bJOiUEZyw",
  },
  {
    slug: "letter-island-quest",
    title: "Letter Island Quest",
    category: "Word Puzzle",
    age: "4-7 Years",
    duration: "12 min",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAF1qZ97h10-KqQV213jJYtlSfq7NWblMKV4EC39FdnB-gGhwADnJg-s2j7KF3cekEKcXjym7if9tg9ZvmKfGHkC0hCqkUQS8geTbNN6vbX8wWvDoG20LI2krsSDCX_mC16vh2cXaykEzT6kc63w8MtMwjDEwpxIEkddjMl1nT_nbhwmRyR7Bjy-JXaq3WXojlW4shRzeSPtCmTFb7b2a_Pzwnzj_XnzmjoUasQVLIB_KRxbKxwMDgih0MoTFa5y_2TDueYIgu51C4",
  },
];

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Activity Templates</h1>
          <p className="text-slate-500 mt-2">Browse and launch interactive learning sessions.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Select>
            <SelectTrigger className="w-full rounded-2xl border p-3 bg-white h-auto">
              <SelectValue placeholder="All Ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-ages">All Ages</SelectItem>
              <SelectItem value="4-7">4-7 Years</SelectItem>
              <SelectItem value="8-12">8-12 Years</SelectItem>
              <SelectItem value="13-16">13-16 Years</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-full rounded-2xl border p-3 bg-white h-auto">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-subjects">All Subjects</SelectItem>
              <SelectItem value="math">Math</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="english">English</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-full rounded-2xl border p-3 bg-white h-auto">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-levels">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            "Flashcards",
            "Matching Games",
            "MCQ Quizzes",
            "Word Puzzles",
            "Story Builder",
            "Math Games",
          ].map((item) => (
            <Button
              key={item}
              variant="outline"
              className="px-5 py-2 rounded-full bg-white border hover:bg-indigo-50 hover:border-indigo-500 transition"
            >
              {item}
            </Button>
          ))}
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.title}
              className="group bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all py-0 gap-0 ring-0"
            >
              <div className="relative w-full h-52">
                <Image
                  src={template.image}
                  alt={template.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <CardContent className="p-6 space-y-4">
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                  {template.category}
                </span>

                <div>
                  <h3 className="text-xl font-bold">{template.title}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Interactive learning experience powered by AI.
                  </p>
                </div>

                <div className="flex justify-between text-sm text-slate-400">
                  <span>{template.age}</span>
                  <span>{template.duration}</span>
                </div>

                <Button
                  render={<Link href={`/activity/${template.slug}`} />}
                  nativeButton={false}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition h-auto"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-indigo-600 text-white shadow-xl text-2xl hover:scale-105 transition">
          AI
        </Button>
      </div>
    </main>
  );
}
