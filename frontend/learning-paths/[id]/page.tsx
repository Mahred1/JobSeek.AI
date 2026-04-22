'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { learningPathsApi } from '@/lib/api';
import { LearningPath, LearningModule, LearningResource, LearningPathStats } from '@/lib/models/learning-path';
import { hasToken } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LearningPathDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [stats, setStats] = useState<LearningPathStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("path");
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  // Fetch the learning path
  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check authentication first
        if (!hasToken()) {
          router.push('/login');
          return;
        }
        
        const pathId = Array.isArray(id) ? id[0] : id;
        const [path, pathStats] = await Promise.all([
          learningPathsApi.getPathById(pathId),
          learningPathsApi.getPathStats(pathId)
        ]);
        
        setLearningPath(path);
        setStats(pathStats);
      } catch (err) {
        console.error("Failed to fetch learning path:", err);
        
        // Check for authentication error
        if (err instanceof Error && err.message.includes('401')) {
          setError("Your session has expired. Please log in again.");
          router.push('/login');
          return;
        }
        
        setError("Failed to load learning path. It may have been deleted or you don't have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLearningPath();
    }
  }, [id, isAuthenticated, router]);

  // Update module progress
  const handleModuleProgressUpdate = async (moduleId: number, updates: any) => {
    if (!learningPath) return;
    
    try {
      setUpdatingProgress(`module-${moduleId}`);
      const updatedPath = await learningPathsApi.updateModuleProgress(
        learningPath.id!,
        moduleId,
        updates
      );
      setLearningPath(updatedPath);
      
      // Refresh stats
      const newStats = await learningPathsApi.getPathStats(learningPath.id!);
      setStats(newStats);
    } catch (err) {
      console.error("Failed to update module progress:", err);
    } finally {
      setUpdatingProgress(null);
    }
  };

  // Update resource progress
  const handleResourceProgressUpdate = async (moduleId: number, resourceId: string, updates: any) => {
    if (!learningPath) return;
    
    try {
      setUpdatingProgress(`resource-${resourceId}`);
      const updatedPath = await learningPathsApi.updateResourceProgress(
        learningPath.id!,
        moduleId,
        resourceId,
        updates
      );
      setLearningPath(updatedPath);
      
      // Refresh stats
      const newStats = await learningPathsApi.getPathStats(learningPath.id!);
      setStats(newStats);
    } catch (err) {
      console.error("Failed to update resource progress:", err);
    } finally {
      setUpdatingProgress(null);
    }
  };

  // Add custom resource
  const handleAddCustomResource = async (moduleId: number, resource: LearningResource) => {
    if (!learningPath) return;
    
    try {
      const updatedPath = await learningPathsApi.addCustomResource(
        learningPath.id!,
        moduleId,
        resource
      );
      setLearningPath(updatedPath);
    } catch (err) {
      console.error("Failed to add custom resource:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Your Learning Path</h2>
        <p className="text-gray-600 text-center max-w-md">
          We're retrieving your personalized learning journey...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 text-center max-w-md mb-6">{error}</p>
        <div className="flex gap-4">
          <Link href="/dashboard/learning-paths">
            <Button variant="outline">Back to Learning Paths</Button>
          </Link>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!learningPath) {
    return null;
  }

  // Calculate overall progress
  const overallProgress = stats ? (stats.completed_modules / stats.total_modules) * 100 : 0;

  return (
    <div className="pb-16">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/learning-paths">
          <Button variant="outline" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Paths
          </Button>
        </Link>
      </div>

      {/* Header with Progress */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-4 mb-8 rounded-xl text-white">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div className="text-4xl bg-white/20 p-4 rounded-full backdrop-blur-sm mr-4">
                  {learningPath.niche[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{learningPath.title}</h1>
                  <p className="text-blue-100 mt-1">Your Personalized Learning Journey</p>
                </div>
              </div>
              <p className="text-lg text-blue-50 mb-4">{learningPath.description}</p>
              
              {/* Progress Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2 bg-white/20" />
                <div className="flex justify-between text-xs text-blue-200 mt-2">
                  <span>{stats?.completed_modules || 0} of {stats?.total_modules || 0} modules completed</span>
                  <span>{stats?.completed_resources || 0} of {stats?.total_resources || 0} resources done</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{Math.round((stats.total_time_spent_minutes || 0) / 60)}h</div>
                  <div className="text-xs text-blue-200">Time Spent</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{stats.average_module_completion_days?.toFixed(0) || 'N/A'}</div>
                  <div className="text-xs text-blue-200">Avg Days/Module</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="path">Learning Path</TabsTrigger>
            <TabsTrigger value="progress">Progress & Analytics</TabsTrigger>
            <TabsTrigger value="notes">Notes & Settings</TabsTrigger>
          </TabsList>

          {/* Learning Path Content */}
          <TabsContent value="path" className="space-y-6">
            {/* Module Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Module Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {learningPath.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        module.completed 
                          ? 'bg-green-50 border-green-200' 
                          : module.progress && module.progress > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => document.getElementById(`module-${module.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Module {index + 1}</span>
                        {module.completed && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Complete
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{module.title}</h3>
                      <Progress value={module.progress || 0} className="h-1" />
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(module.progress || 0)}% complete
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <div className="space-y-8">
              {learningPath.modules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  index={index}
                  onUpdateProgress={handleModuleProgressUpdate}
                  onUpdateResourceProgress={handleResourceProgressUpdate}
                  onAddCustomResource={handleAddCustomResource}
                  updatingProgress={updatingProgress}
                />
              ))}
            </div>
          </TabsContent>

          {/* Progress & Analytics */}
          <TabsContent value="progress" className="space-y-6">
            {stats && <ProgressAnalytics stats={stats} />}
          </TabsContent>

          {/* Notes & Settings */}
          <TabsContent value="notes" className="space-y-6">
            <NotesAndSettings
              learningPath={learningPath}
              onUpdateNotes={(notes) => learningPathsApi.updatePathNotes(learningPath.id!, notes)}
              onUpdateTargetDate={(date) => learningPathsApi.updateTargetDate(learningPath.id!, date)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Module Card Component
function ModuleCard({
  module,
  index,
  onUpdateProgress,
  onUpdateResourceProgress,
  onAddCustomResource,
  updatingProgress
}: {
  module: LearningModule;
  index: number;
  onUpdateProgress: (moduleId: number, updates: any) => Promise<void>;
  onUpdateResourceProgress: (moduleId: number, resourceId: string, updates: any) => Promise<void>;
  onAddCustomResource: (moduleId: number, resource: LearningResource) => Promise<void>;
  updatingProgress: string | null;
}) {
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState<LearningResource>({
    type: "article",
    name: "",
    link: "",
    description: ""
  });

  const handleToggleComplete = () => {
    onUpdateProgress(module.id, { completed: !module.completed });
  };

  const handleAddResource = async () => {
    if (!newResource.name || !newResource.link) return;
    
    await onAddCustomResource(module.id, newResource);
    setNewResource({ type: "article", name: "", link: "", description: "" });
    setShowAddResource(false);
  };

  const getResourceProgress = (resourceId: string) => {
    return module.resource_progress?.find(rp => rp.resource_id === resourceId);
  };

  return (
    <Card id={`module-${module.id}`} className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                {index + 1}
              </div>
              <CardTitle className="text-xl">{module.title}</CardTitle>
              {module.completed && (
                <Badge className="bg-green-100 text-green-800">
                  ✓ Completed
                </Badge>
              )}
            </div>
            <CardDescription>{module.description}</CardDescription>
          </div>
          <Button
            variant={module.completed ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleComplete}
            disabled={updatingProgress === `module-${module.id}`}
          >
            {updatingProgress === `module-${module.id}` ? (
              "Updating..."
            ) : module.completed ? (
              "Mark Incomplete"
            ) : (
              "Mark Complete"
            )}
          </Button>
        </div>
        
        {/* Module Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(module.progress || 0)}%</span>
          </div>
          <Progress value={module.progress || 0} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Module Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Timeline</div>
            <div className="text-lg font-semibold">{module.timeline}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Difficulty</div>
            <div className="text-lg font-semibold">{module.difficulty}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Resources</div>
            <div className="text-lg font-semibold">
              {module.resources.length + (module.custom_resources?.length || 0)}
            </div>
          </div>
        </div>

        {/* Topics */}
        <div>
          <h4 className="font-semibold mb-2">Topics Covered</h4>
          <div className="flex flex-wrap gap-2">
            {module.topics.map((topic, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Learning Resources</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddResource(!showAddResource)}
            >
              + Add Resource
            </Button>
          </div>

          {/* Add Resource Form */}
          {showAddResource && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Add Custom Resource</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-name">Resource Name</Label>
                    <Input
                      id="resource-name"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      placeholder="e.g., Advanced React Tutorial"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resource-type">Type</Label>
                    <select
                      id="resource-type"
                      className="w-full p-2 border rounded-md"
                      value={newResource.type}
                      onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                    >
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="course">Course</option>
                      <option value="book">Book</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="documentation">Documentation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="resource-link">Link</Label>
                  <Input
                    id="resource-link"
                    value={newResource.link}
                    onChange={(e) => setNewResource({ ...newResource, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="resource-description">Description (Optional)</Label>
                  <Textarea
                    id="resource-description"
                    value={newResource.description || ""}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="Brief description of this resource..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddResource} size="sm">
                    Add Resource
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddResource(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resource List */}
          <div className="space-y-3">
            {[...module.resources, ...(module.custom_resources || [])].map((resource, i) => {
              const resourceId = `${module.id}-${i}`;
              const progress = getResourceProgress(resourceId);
              const isUpdating = updatingProgress === `resource-${resourceId}`;

              return (
                <div
                  key={i}
                  className={`p-4 border rounded-lg transition-all ${
                    progress?.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                        <h5 className="font-medium">{resource.name}</h5>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Open Resource →
                      </a>
                    </div>
                    <Button
                      variant={progress?.completed ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => onUpdateResourceProgress(module.id, resourceId, {
                        completed: !progress?.completed
                      })}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        "..."
                      ) : progress?.completed ? (
                        "✓ Done"
                      ) : (
                        "Mark Done"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        {module.tips && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-yellow-800">💡 Tips</h4>
            <p className="text-sm text-yellow-700">{module.tips}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Progress Analytics Component
function ProgressAnalytics({ stats }: { stats: LearningPathStats }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Your learning journey statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.completed_modules}</div>
              <div className="text-sm text-gray-600">Modules Completed</div>
              <div className="text-xs text-gray-500">of {stats.total_modules} total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed_resources}</div>
              <div className="text-sm text-gray-600">Resources Done</div>
              <div className="text-xs text-gray-500">of {stats.total_resources} total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(stats.total_time_spent_minutes / 60)}h
              </div>
              <div className="text-sm text-gray-600">Time Invested</div>
              <div className="text-xs text-gray-500">{stats.total_time_spent_minutes} minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.average_module_completion_days?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg Days/Module</div>
              <div className="text-xs text-gray-500">completion rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.estimated_completion_date && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-2">
                {new Date(stats.estimated_completion_date).toLocaleDateString()}
              </div>
              <div className="text-gray-600">Estimated completion date</div>
              <div className="text-sm text-gray-500 mt-2">
                Based on your current learning pace
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Notes and Settings Component
function NotesAndSettings({
  learningPath,
  onUpdateNotes,
  onUpdateTargetDate
}: {
  learningPath: LearningPath;
  onUpdateNotes: (notes: string) => Promise<void>;
  onUpdateTargetDate: (date: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(learningPath.custom_notes || "");
  const [targetDate, setTargetDate] = useState(
    learningPath.target_completion_date 
      ? new Date(learningPath.target_completion_date).toISOString().split('T')[0]
      : ""
  );

  const handleSaveNotes = async () => {
    await onUpdateNotes(notes);
  };

  const handleSaveTargetDate = async () => {
    if (targetDate) {
      await onUpdateTargetDate(new Date(targetDate).toISOString());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Notes</CardTitle>
          <CardDescription>Keep track of your thoughts, insights, and progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes, insights, or goals here..."
            rows={6}
          />
          <Button onClick={handleSaveNotes}>Save Notes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Goals</CardTitle>
          <CardDescription>Set targets to stay motivated and on track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="target-date">Target Completion Date</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveTargetDate}>Update</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 