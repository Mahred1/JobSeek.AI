import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                  Prepare for your <br />
                  <span className="gradient-text">dream career</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  QualifyAI helps students and recent graduates identify skill
                  gaps, optimize resumes, and create personalized learning
                  pathways.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="rounded-full">
                    <Link href="/register">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Link href="#features">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="bg-gradient-to-br from-blue-100 to-orange-100 rounded-3xl p-8 relative z-10">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="relative h-64 bg-gray-100 rounded-lg mb-6 overflow-hidden">
                      <div className="absolute inset-0 flex flex-col p-4 bg-gradient-to-br from-blue-600/90 to-orange-500/90 text-white">
                        <h3 className="text-xl font-semibold mb-2">
                          Sarah's Skill Gap Analysis
                        </h3>
                        <div className="flex-grow flex items-center justify-center">
                          <div className="w-full max-w-md">
                            <div className="bg-white/20 rounded-full h-2 mb-3">
                              <div
                                className="bg-white h-2 rounded-full"
                                style={{ width: "75%" }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>React</span>
                              <span>75%</span>
                            </div>
                            <div className="bg-white/20 rounded-full h-2 mt-3 mb-3">
                              <div
                                className="bg-white h-2 rounded-full"
                                style={{ width: "60%" }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Node.js</span>
                              <span>60%</span>
                            </div>
                            <div className="bg-white/20 rounded-full h-2 mt-3 mb-3">
                              <div
                                className="bg-white h-2 rounded-full"
                                style={{ width: "45%" }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>AWS</span>
                              <span>45%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Frontend Developer</h4>
                        <p className="text-sm text-gray-500">Gap Analysis</p>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-blue-200/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-orange-200/50 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Three powerful tools in one platform
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                QualifyAI helps you prepare for your career with AI-powered
                tools tailored to your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg gradient-bg mb-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M12 2v8"></path>
                      <path d="m16 4-4 4-4-4"></path>
                      <path d="M3 12h10"></path>
                      <path d="m7 16-4-4 4-4"></path>
                      <path d="M21 12h-4"></path>
                      <path d="M12 22v-8"></path>
                      <path d="m16 20-4-4-4 4"></path>
                    </svg>
                  </div>
                  <CardTitle>Learning Pathways</CardTitle>
                  <CardDescription>
                    Personalized learning recommendations based on your career
                    goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Curated online course recommendations
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Structured learning progression
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Industry-aligned skill development
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg gradient-bg mb-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                      <path d="M5 12V5a2 2 0 0 1 2-2h7l5 5v4"></path>
                      <path d="M5 21h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z"></path>
                      <path d="M7 17h.01"></path>
                      <path d="M11 17h.01"></path>
                    </svg>
                  </div>
                  <CardTitle>Resume Enhancement</CardTitle>
                  <CardDescription>
                    AI-powered resume analysis and improvement suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      ATS compatibility optimization
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Content and structure feedback
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Industry-specific improvement suggestions
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg gradient-bg mb-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="m22 8-6 4 6 4V8Z"></path>
                      <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                      <path d="M6 12h.01"></path>
                      <path d="M10 12h.01"></path>
                    </svg>
                  </div>
                  <CardTitle>Skill Gap Analysis</CardTitle>
                  <CardDescription>
                    Identify skill gaps based on your resume and desired job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Multi-source skill extraction
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Visual gap analysis
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Actionable improvement recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Trusted by students everywhere
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                See how QualifyAI has helped students achieve their career
                goals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 mr-4"></div>
                  <div>
                    <h4 className="font-medium">Alex Johnson</h4>
                    <p className="text-sm text-gray-500">
                      Computer Science Student
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "QualifyAI helped me identify critical skill gaps for my
                  desired data science role. Within 3 months of following the
                  recommended learning path, I secured an internship!"
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 mr-4"></div>
                  <div>
                    <h4 className="font-medium">Maya Patel</h4>
                    <p className="text-sm text-gray-500">Business Graduate</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The resume enhancement feature was a game-changer. My
                  callback rate for interviews increased dramatically after
                  implementing the AI's suggestions."
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 mr-4"></div>
                  <div>
                    <h4 className="font-medium">David Kim</h4>
                    <p className="text-sm text-gray-500">UX Design Student</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "I wasn't sure what skills to focus on for my UX career.
                  QualifyAI provided a clear roadmap and recommended courses
                  that perfectly matched my learning style."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                Ready to accelerate your career?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of students who are using QualifyAI to prepare
                for their dream careers.
              </p>
              <Button size="lg" className="rounded-full px-8 py-6">
                <Link href="/register">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <span className="text-2xl font-bold gradient-text">
                QualifyAI
              </span>
              <p className="mt-2 text-gray-400 max-w-xs">
                AI-powered career readiness platform for students and recent
                graduates.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} QualifyAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
