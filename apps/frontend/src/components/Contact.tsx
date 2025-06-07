import { Mail, MessageCircle, Github, Twitter, Coffee, MapPin, Clock } from "lucide-react";

export function Contact() {
  const email = 'abhasbehera320@gmail.com';
  
  const handleGmail = () => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Have questions, feedback, or just want to chat? I'd love to hear from you!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-gray-900">Get in Touch</h2>
              </div>
              
              <div className="space-y-8">
                {/* Primary Contact */}
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to connect?</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Whether you have questions about DraftDock, want to collaborate, or just want to say hello – I'd love to hear from you!
                  </p>
                  <button
                    onClick={handleGmail}
                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-colors font-medium text-lg"
                  >
                    <Mail className="w-5 h-5" />
                    Email Me
                  </button>
                </div>

                {/* What to expect */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Information:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-green-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Response Time</h4>
                        <p className="text-gray-600 text-sm">Typically within 24-48 hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Communication</h4>
                        <p className="text-gray-600 text-sm">Professional and detailed responses</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Great reasons to reach out:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Questions about DraftDock</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Feature requests or feedback</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">Collaboration opportunities</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700">Just saying hello!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info & Social Links */}
          <div className="space-y-6">
            
            {/* Quick Contact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a onClick={handleGmail} className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                      abhasbehera320@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Open To</p>
                    <p className="text-gray-900">Ideas, feedback, or exciting collaborations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-gray-900">Bhubaneswar, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Online</h3>
              <div className="space-y-3">
                <a
                  href="https://github.com/MistaHolmes/DraftDock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <Github className="w-5 h-5 text-gray-600 group-hover:text-black" />
                  <div>
                    <p className="font-medium text-gray-900">GitHub</p>
                    <p className="text-sm text-gray-600">Check out the code</p>
                  </div>
                </a>
                <a
                  href="https://x.com/AbhasBehera1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <Twitter className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Twitter</p>
                    <p className="text-sm text-gray-600">Latest updates & thoughts</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support DraftDock</h3>
              <p className="text-gray-600 text-sm mb-4">
                If DraftDock has been helpful to you, consider buying me a coffee to support development!
              </p>
              <a
                href="https://coff.ee/abhastheain"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-md transition-colors font-medium w-full justify-center"
              >
                <Coffee className="w-4 h-4" />
                Buy Me a Coffee
              </a>
            </div>

            {/* FAQ Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Before you reach out</h3>
              <p className="text-blue-800 text-sm">
                Check out the <a href="/api-docs" className="underline hover:no-underline">API documentation</a> if you're looking for technical information, or browse existing drafts for inspiration!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}