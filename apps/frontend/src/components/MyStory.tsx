import { Coffee, Code, Heart, Lightbulb } from "lucide-react";

export function MyStory() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Story</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            The journey behind DraftDock and why I built this platform for writers and creators.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Hello, I'm Abhas</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Welcome to my corner of the internet! I'm a passionate developer and writer who believes that 
              great ideas deserve great tools to bring them to life. DraftDock was born from my own 
              frustrations with existing blogging platforms and my desire to create something better.
            </p>
          </section>

          {/* The Problem */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-gray-900">The Problem I Faced</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              As someone who loves to write and share ideas, I found myself constantly switching between 
              different platforms, each with their own limitations. Some had great editors but poor 
              organization, others had excellent features but were overly complex. I wanted something 
              simple, clean, and focused on what matters most – the writing experience.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I needed a place where I could draft my thoughts, organize my ideas, and share them with 
              the world without the distractions and complications that come with most blogging platforms today.
            </p>
          </section>

          {/* The Solution */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Building DraftDock</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              That's when I decided to build DraftDock – a clean, minimalist platform that puts writers first. 
              I wanted to create something that feels natural to use, whether you're jotting down a quick 
              thought or crafting a detailed article.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Every feature in DraftDock was designed with one goal in mind: to help you focus on your 
              writing without getting in your way. From the distraction-free editor to the simple 
              organization system, everything is built to enhance your creative process.
            </p>
          </section>

          {/* Personal Touch */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Coffee className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Beyond the Code</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              When I'm not coding or writing, you'll find me exploring new technologies, reading about 
              design principles, or enjoying a good cup of coffee while brainstorming the next feature 
              for DraftDock. I believe that the best tools are built by people who actually use them, 
              which is why I'm both a creator and an active user of this platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I'm always excited to connect with fellow writers and creators. Whether you have feedback, 
              suggestions, or just want to chat about writing and technology, feel free to reach out!
            </p>
          </section>

          {/* Call to Action */}
          <section className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Let's Connect</h3>
            <p className="text-gray-700 mb-4">
              I'd love to hear about your writing journey and how DraftDock can help you create better content.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="/contact" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                Get in Touch
              </a>
              <a 
                href="/create-blog" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors font-medium"
              >
                Start Writing
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}