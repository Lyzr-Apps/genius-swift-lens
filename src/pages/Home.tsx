import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  FileText,
  BookOpen,
  TrendingUp,
  Filter,
  RotateCw
} from 'lucide-react'

// TypeScript interfaces based on ACTUAL response schema from research_orchestrator_response.json
interface ParsedTopics {
  main_topic: string
  key_themes: string[]
  search_queries: string[]
}

interface SummarizedResource {
  title: string
  summary: string
  key_findings: string[]
  relevance_to_query: string
  recommended_priority: string
  source: string
  url: string
  authors: string[]
}

interface ResearchResults {
  total_resources_found: number
  summarized_resources: SummarizedResource[]
}

interface OrchestratorResult {
  original_query: string
  parsed_topics: ParsedTopics
  research_results: ResearchResults
  overall_insights: string
  research_coverage: string
  recommendations: string[]
}

interface OrchestratorResponse {
  status: string
  result: OrchestratorResult
  metadata?: {
    agent_name: string
    timestamp: string
    workflow_steps_completed: string[]
  }
}

// Sample data from PRD
const sampleResults: SummarizedResource[] = [
  {
    title: "Transformer Models in Climate Prediction: A Comprehensive Review",
    authors: ["Chen, L.", "Martinez, R.", "Patel, S."],
    source: "Nature Climate Change",
    summary: "This paper presents a systematic review of transformer-based deep learning architectures applied to climate modeling. The study analyzes 47 published models and demonstrates that attention mechanisms improve long-term climate predictions by 23% compared to traditional LSTM approaches.",
    key_findings: [
      "Attention mechanisms improve climate predictions by 23%",
      "Analyzed 47 transformer-based climate models",
      "Outperforms traditional LSTM approaches"
    ],
    relevance_to_query: "Directly addresses AI applications in climate science",
    recommended_priority: "high",
    url: "https://example.com/paper1"
  },
  {
    title: "Machine Learning for Carbon Capture Optimization in Industrial Settings",
    authors: ["Johnson, K.", "Wu, T."],
    source: "Energy & Environmental Science",
    summary: "Presents novel reinforcement learning algorithms for optimizing carbon capture processes in power plants. Field tests showed 18% improvement in capture efficiency and 12% reduction in operational costs over 6-month deployment.",
    key_findings: [
      "18% improvement in capture efficiency",
      "12% reduction in operational costs",
      "Deployed and tested in real power plants"
    ],
    relevance_to_query: "Demonstrates practical ML applications in carbon capture",
    recommended_priority: "high",
    url: "https://example.com/paper2"
  },
  {
    title: "AI-Driven Renewable Energy Grid Management: Challenges and Opportunities",
    authors: ["Anderson, M.", "et al."],
    source: "IEEE Transactions on Smart Grid",
    summary: "Explores deep reinforcement learning for real-time renewable energy grid balancing. Proposes multi-agent system architecture that reduced grid instability events by 34% in simulation studies across 5 different grid configurations.",
    key_findings: [
      "34% reduction in grid instability events",
      "Multi-agent system architecture",
      "Tested across 5 different grid configurations"
    ],
    relevance_to_query: "Highlights AI solutions for renewable energy challenges",
    recommended_priority: "high",
    url: "https://example.com/paper3"
  }
]

const AGENT_ID = "6961099dc57d451439d4bdb5"

type LoadingStage = 'idle' | 'parsing' | 'searching' | 'summarizing' | 'complete'
type FilterType = 'all' | 'high' | 'medium' | 'low'

export default function Home() {
  const [researchTopic, setResearchTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<OrchestratorResponse | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [filterPriority, setFilterPriority] = useState<FilterType>('all')
  const [showSampleData, setShowSampleData] = useState(true)

  const charCount = researchTopic.length

  const handleSearch = async () => {
    if (!researchTopic.trim()) {
      setError('Please enter a research topic')
      return
    }

    setLoading(true)
    setError(null)
    setShowSampleData(false)
    setLoadingStage('parsing')

    try {
      // Stage 1: Parsing
      await new Promise(resolve => setTimeout(resolve, 800))
      setLoadingStage('searching')

      // Stage 2: Searching
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoadingStage('summarizing')

      // Stage 3: Call the Research Orchestrator Agent
      const result = await fetch('https://agent-prod.studio.lyzr.ai/v2/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_LYZR_API_KEY || ''
        },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          message: researchTopic,
          user_id: `user_${Date.now()}`
        })
      })

      if (!result.ok) {
        throw new Error(`API request failed: ${result.status}`)
      }

      const data = await result.json()

      // Parse the response - the API returns the data structure directly
      if (data && data.response) {
        setResponse(data.response as OrchestratorResponse)
        setLoadingStage('complete')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch research results')
      setLoadingStage('idle')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCards(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleNewSearch = () => {
    setResearchTopic('')
    setResponse(null)
    setError(null)
    setLoadingStage('idle')
    setExpandedCards(new Set())
    setFilterPriority('all')
    setShowSampleData(true)
  }

  const getLoadingProgress = () => {
    switch (loadingStage) {
      case 'parsing': return 25
      case 'searching': return 50
      case 'summarizing': return 75
      case 'complete': return 100
      default: return 0
    }
  }

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'parsing': return 'Parsing topics...'
      case 'searching': return 'Searching sources...'
      case 'summarizing': return 'Generating summaries...'
      case 'complete': return 'Complete!'
      default: return ''
    }
  }

  // Get results to display (either from agent response or sample data)
  const displayResults = response?.result?.research_results?.summarized_resources || (showSampleData ? sampleResults : [])

  // Apply priority filter
  const filteredResults = filterPriority === 'all'
    ? displayResults
    : displayResults.filter(r => r.recommended_priority === filterPriority)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'low': return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Research Discovery Engine</h1>
              <p className="text-sm text-slate-400">AI-powered academic research assistant</p>
            </div>
          </div>
          <Button
            onClick={handleNewSearch}
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            New Search
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Input Section */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Enter Your Research Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="Enter your research topic—from a single question to detailed paragraphs..."
                className="min-h-[120px] bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                disabled={loading}
              />
              <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                {charCount} characters
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !researchTopic.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering Research...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Discover Research
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading Progress */}
        {loading && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-medium">{getLoadingText()}</span>
                  <span className="text-slate-400">{getLoadingProgress()}%</span>
                </div>
                <Progress value={getLoadingProgress()} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span className={loadingStage === 'parsing' ? 'text-emerald-400' : ''}>Parsing</span>
                  <span className={loadingStage === 'searching' ? 'text-emerald-400' : ''}>Searching</span>
                  <span className={loadingStage === 'summarizing' ? 'text-emerald-400' : ''}>Summarizing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parsed Topics Section */}
        {response?.result?.parsed_topics && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Parsed Research Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Main Topic</div>
                <div className="text-white font-medium">{response.result.parsed_topics.main_topic}</div>
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <div className="text-sm text-slate-400 mb-2">Key Themes</div>
                <div className="flex flex-wrap gap-2">
                  {response.result.parsed_topics.key_themes.map((theme, i) => (
                    <Badge key={i} variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/5">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-2">Search Queries Generated</div>
                <div className="space-y-1">
                  {response.result.parsed_topics.search_queries.map((query, i) => (
                    <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <Search className="w-3 h-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                      {query}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {filteredResults.length > 0 && (
          <>
            {/* Filter Bar */}
            <div className="mb-6 flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-2">
                <Badge
                  onClick={() => setFilterPriority('all')}
                  className={`cursor-pointer ${filterPriority === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  All ({displayResults.length})
                </Badge>
                <Badge
                  onClick={() => setFilterPriority('high')}
                  className={`cursor-pointer ${filterPriority === 'high' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  High Priority ({displayResults.filter(r => r.recommended_priority === 'high').length})
                </Badge>
                <Badge
                  onClick={() => setFilterPriority('medium')}
                  className={`cursor-pointer ${filterPriority === 'medium' ? 'bg-yellow-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  Medium Priority ({displayResults.filter(r => r.recommended_priority === 'medium').length})
                </Badge>
              </div>
              {!showSampleData && (
                <div className="ml-auto text-sm text-slate-400">
                  {response?.result?.research_results?.total_resources_found || filteredResults.length} resources found
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredResults.map((resource, index) => {
                const isExpanded = expandedCards.has(index)
                const citation = `${resource.authors.join(', ')} - ${resource.title}. ${resource.source}.`

                return (
                  <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg text-white leading-tight flex-1">
                          {resource.title}
                        </CardTitle>
                        <Badge className={`${getPriorityColor(resource.recommended_priority)} border flex-shrink-0`}>
                          {resource.recommended_priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                        <FileText className="w-4 h-4" />
                        <span>{resource.source}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {resource.authors.join(', ')}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary */}
                      <div>
                        <div className="text-sm font-medium text-slate-300 mb-1">Summary</div>
                        <p className={`text-sm text-slate-400 ${!isExpanded && 'line-clamp-3'}`}>
                          {resource.summary}
                        </p>
                        {resource.summary.length > 150 && (
                          <button
                            onClick={() => toggleExpanded(index)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> Read more
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Key Findings - only show when expanded */}
                      {isExpanded && resource.key_findings && resource.key_findings.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-slate-300 mb-2">Key Findings</div>
                          <ul className="space-y-1">
                            {resource.key_findings.map((finding, i) => (
                              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Relevance */}
                      {isExpanded && resource.relevance_to_query && (
                        <div>
                          <div className="text-sm font-medium text-slate-300 mb-1">Relevance</div>
                          <p className="text-sm text-slate-400">{resource.relevance_to_query}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Original
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-400 hover:bg-slate-700"
                          onClick={() => copyToClipboard(citation)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Citation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* Overall Insights */}
        {response?.result?.overall_insights && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="text-white">Overall Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">{response.result.overall_insights}</p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {response?.result?.recommendations && response.result.recommendations.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-white">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {response.result.recommendations.map((rec, i) => (
                  <li key={i} className="text-slate-300 flex items-start gap-3">
                    <span className="text-emerald-400 font-bold mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !showSampleData && filteredResults.length === 0 && !error && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No results found. Try a different search query.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
