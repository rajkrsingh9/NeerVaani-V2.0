
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { marketAnalysis, type MarketAnalysisInput, type MarketAnalysisOutput } from '@/ai/flows/market-analysis-flow';
import { MarketAnalysisInputSchema } from '@/ai/schemas/market-analysis-schemas';
import { MicButton } from '@/components/ui/mic-button';
import { useToast } from '@/hooks/use-toast';
import { Bot, DollarSign, Lightbulb, TrendingUp, Info, MapPin, Package, Store, FileText, ArrowDown, ArrowUp, Minus, BarChart, Scale, ShoppingBasket, Brain, HelpCircle, Calendar, Link as LinkIcon, Briefcase, ChevronsUpDown, Coins, LineChart, PiggyBank, Target as TargetIcon } from 'lucide-react';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { useLanguage } from '@/context/language-context';
import { languages } from '@/lib/i18n';
import Image from 'next/image';


const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
        case 'Upward': return <ArrowUp className="h-4 w-4 text-green-500" />;
        case 'Downward': return <ArrowDown className="h-4 w-4 text-red-500" />;
        case 'Stable': return <Minus className="h-4 w-4 text-gray-500" />;
        case 'Volatile': return <BarChart className="h-4 w-4 text-yellow-500" />;
        default: return null;
    }
};

const CostingCard = ({ analysis }: { analysis: { estimatedYield: string; costOfProduction: string; postProductionCost: string; estimatedSales: string; estimatedProfit: string; } }) => (
    <Card className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <LineChart className="h-6 w-6" />
                Financial Analysis
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TargetIcon size={16} /> Estimated Yield</p>
                    <p className="text-lg font-bold">{analysis.estimatedYield}</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Coins size={16} /> Total Costs</p>
                    <p className="text-lg font-bold">{analysis.costOfProduction} + {analysis.postProductionCost}</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign size={16} /> Estimated Sales</p>
                    <p className="text-lg font-bold">{analysis.estimatedSales}</p>
                </div>
            </div>
             <div className="p-4 bg-green-100 dark:bg-green-800/30 rounded-lg text-center">
                <p className="text-md font-medium text-green-700 dark:text-green-200 flex items-center justify-center gap-2"><PiggyBank size={18} /> Estimated Profit</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{analysis.estimatedProfit}</p>
            </div>
        </CardContent>
    </Card>
);

export function MarketAnalysisTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [analysis, setAnalysis] = useState<MarketAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const form = useForm<MarketAnalysisInput>({
    resolver: zodResolver(MarketAnalysisInputSchema),
    defaultValues: {
      commodity: '',
      location: user?.location || '',
      market: '',
      userNotes: '',
      query: 'Provide a general market analysis based on the fields I have filled out.',
      language: locale,
    },
  });

  const { isRecording: recCommodity, startRecording: startRecCommodity, stopRecording: stopRecCommodity } = useSpeechToText({ onTranscript: (t) => form.setValue('commodity', t) });
  const { isRecording: recMarket, startRecording: startRecMarket, stopRecording: stopRecMarket } = useSpeechToText({ onTranscript: (t) => form.setValue('market', t) });
  const { isRecording: recNotes, startRecording: startRecNotes, stopRecording: stopRecNotes } = useSpeechToText({ onTranscript: (t) => form.setValue('userNotes', t) });
  const { isRecording: recQuery, startRecording: startRecQuery, stopRecording: stopRecQuery } = useSpeechToText({ onTranscript: (t) => form.setValue('query', t) });

  async function onSubmit(values: MarketAnalysisInput) {
    setLoading(true);
    setAnalysis(null);
    try {
      const currentLanguageName = languages.find(l => l.code === locale)?.name.split(' ')[0] || 'English';
      const result = await marketAnalysis({
          ...values, 
          location: user?.location || values.location, // Ensure location is passed
          language: currentLanguageName
      });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not fetch market analysis. The model may be temporarily unavailable. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="shadow-lg h-full">
        <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><Briefcase/>
              {t('Your Market Analyst')}
              </CardTitle>
              <CardDescription>{t('Get AI-powered market intelligence for your commodity.')}</CardDescription>
            </div>
            <div className="hidden lg:block relative">
              <Image
                src="/images/market.webp"
                alt="A 3D illustration of a market analysis"
                width={150}
                height={150}
                className="rounded-lg"
                data-ai-hint="market analysis"
              />
            </div>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                </Button>
            </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="commodity" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Package size={14}/> Commodity</FormLabel>
                        <div className="relative">
                          <FormControl><Input placeholder="e.g., Rice, Tomato" {...field} /></FormControl>
                          <MicButton isRecording={recCommodity} onClick={() => recCommodity ? stopRecCommodity() : startRecCommodity()} className="absolute right-1 top-1/2 -translate-y-1/2" />
                        </div>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="market" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Store size={14}/> Market (Optional)</FormLabel>
                        <div className="relative">
                          <FormControl><Input placeholder="e.g., Serampore" {...field} /></FormControl>
                          <MicButton isRecording={recMarket} onClick={() => recMarket ? stopRecMarket() : startRecMarket()} className="absolute right-1 top-1/2 -translate-y-1/2" />
                        </div>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="userNotes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><FileText size={14}/> Additional Notes (Optional)</FormLabel>
                        <div className="relative">
                          <FormControl><Textarea placeholder="e.g., interested in long-term storage options, need prices for the last 2 weeks..." {...field} rows={2} /></FormControl>
                          <MicButton isRecording={recNotes} onClick={() => recNotes ? stopRecNotes() : startRecNotes()} className="absolute right-1 top-2" />
                        </div>
                      </FormItem>
                  )} />

                  <FormField control={form.control} name="query" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Bot size={14}/> Your Question*</FormLabel>
                        <div className="relative">
                          <FormControl><Textarea placeholder="e.g., What is the price of tomatoes in Pune today?" {...field} /></FormControl>
                          <MicButton isRecording={recQuery} onClick={() => recQuery ? stopRecQuery() : startRecQuery()} className="absolute right-1 top-2" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Analyzing...' : 'Get Analysis'}
                  </Button>
                </form>
              </Form>

              {loading && (
                <div className="mt-8 flex justify-center">
                  <Loader />
                </div>
              )}

              {analysis && (
                <div className="mt-8 space-y-6">
                  {analysis.costingAnalysis && <CostingCard analysis={analysis.costingAnalysis} />}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Lightbulb/> Actionable Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold text-primary">{analysis.actionableInsight.recommendation}</p>
                      <p className="text-sm text-muted-foreground mt-1">{analysis.actionableInsight.reasoning}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><DollarSign/> Current Price</CardTitle>
                        <CardDescription>{analysis.corePriceInfo.currentPrice.market}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{analysis.corePriceInfo.currentPrice.price} <span className="text-lg font-normal text-muted-foreground">{analysis.corePriceInfo.currentPrice.unit}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Daily Range: {analysis.corePriceInfo.dailyPriceRange.low} - {analysis.corePriceInfo.dailyPriceRange.high} {analysis.corePriceInfo.dailyPriceRange.unit}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp/> Price Trend</CardTitle>
                        <CardDescription>{analysis.historicalTrendAnalysis.priceTrend.period}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="flex items-center gap-2">
                              <TrendIcon direction={analysis.historicalTrendAnalysis.priceTrend.direction} />
                              <p className="text-3xl font-bold">{analysis.historicalTrendAnalysis.priceTrend.direction}</p>
                          </div>
                          <p className={cn("text-sm font-semibold mt-1", analysis.historicalTrendAnalysis.priceChange.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                              {analysis.historicalTrendAnalysis.priceChange.change.toFixed(2)} ({analysis.historicalTrendAnalysis.priceChange.percentageChange.toFixed(2)}%) vs yesterday
                          </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Scale/> Market Dynamics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-muted-foreground flex items-center gap-1"><ShoppingBasket size={14}/> Supply</span>
                              <Badge variant="outline">{analysis.marketDynamics.supplyStatus.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-muted-foreground flex items-center gap-1"><Brain size={14}/> Demand</span>
                              <Badge variant="outline">{analysis.marketDynamics.demandStatus.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-primary" />
                          Detailed Analysis & Data Source
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none space-y-4 dark:prose-invert">
                        <div>
                          <h4 className="font-semibold">Overall Summary</h4>
                          <p>{analysis.marketSummary}</p>
                        </div>
                         <div>
                          <h4 className="font-semibold">Supply Impact</h4>
                          <p>{analysis.marketDynamics.supplyStatus.impact}</p>
                        </div>
                         <div>
                          <h4 className="font-semibold">Demand Impact</h4>
                          <p>{analysis.marketDynamics.demandStatus.impact}</p>
                        </div>
                         <div>
                          <h4 className="font-semibold">Data Source</h4>
                          <p>
                            {analysis.additionalInfo.dataSource} as of {new Date(analysis.additionalInfo.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
