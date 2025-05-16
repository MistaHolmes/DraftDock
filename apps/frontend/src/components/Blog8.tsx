import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  summary: string;
  label: string;
  author: string;
  published: string;
  image: string;
  tags?: string[];
}

interface Blog8Props {
  heading?: string;
  description?: string;
  posts?: Post[];
}

const Blog8 = ({
  description = "Where code meets creativity — deep dives into the evolving world of technology, design thinking, and the future of digital experiences.",
  posts = [],
}: Blog8Props) => {
  return (
    <section className="py-2 bg-white">
      <div className="container mx-auto flex flex-col items-center gap-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl">
          <p className="text-lg text-gray-600">{description}</p>
        </div>

        <div className="grid gap-12 w-full max-w-5xl">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="grid sm:grid-cols-10 gap-6 items-center px-6 py-8">
                <div className="sm:col-span-5 space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-gray-500">
                    {post.tags?.map((tag) => (
                      <span key={tag} className="bg-gray-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    <a target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {post.title}
                    </a>
                  </h3>
                  <p className="text-gray-700">{post.summary}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.published}</span>
                  </div>
                  <div>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Read more</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
                    </a>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Blog8 };
