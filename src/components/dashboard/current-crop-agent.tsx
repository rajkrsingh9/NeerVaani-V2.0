
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addCurrentCrop, getAllCurrentCrops } from '@/lib/firebase/services';
import type { CurrentCrop } from '@/lib/types';
import { marketAnalysis, type MarketAnalysisOutput } from '@/ai/flows/market-analysis-flow';
import { getPostHarvestAdvice, type PostHarvestOutput } from '@/ai/flows/post-harvest-flow';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Sparkles, Send, Bot, Leaf, Droplet, FlaskConical, Landmark, ShieldAlert, TrendingUp, Info, DollarSign, Lightbulb, MapPin, Package, Store, FileText, ArrowDown, ArrowUp, Minus, BarChart, Scale, ShoppingBasket, Brain, HelpCircle, Briefcase, ChevronsUpDown, PackageSearch, Truck, Warehouse, BadgePercent, Microscope, Recycle, Coins, LineChart, PiggyBank, Target as TargetIcon } from 'lucide-react';
import { askCurrentCropAgent, type CurrentCropAgentOutput } from '@/ai/flows/current-crop-agent-flow';
import { languages } from '@/lib/i18n';
import { useLanguage } from '@/context/language-context';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';


const addCropFormSchema = z.object({
  cropName: z.string().min(2, "Crop name is required."),
  fieldSize: z.string().min(1, "Field size is required."),
  location: z.string().min(2, "Location is required."),
  sowingDate: z.date({ required_error: "A sowing date is required." }),
  additionalInfo: z.string().optional(),
});
type AddCropFormValues = z.infer<typeof addCropFormSchema>;

const agentQueryFormSchema = z.object({
  selectedCropId: z.string().min(1, "Please select a crop."),
  query: z.string().optional(),
});
type AgentQueryFormValues = z.infer<typeof agentQueryFormSchema>;

const postHarvestYieldSchema = z.object({
    yield: z.string().min(1, 'Please provide an estimated yield.'),
});
type PostHarvestYieldValues = z.infer<typeof postHarvestYieldSchema>;


const adviceIcons: Record<string, React.ReactNode> = {
    Bot: <Bot className="h-5 w-5" />,
    TrendingUp: <TrendingUp className="h-5 w-5" />,
    Landmark: <Landmark className="h-5 w-5" />,
    FlaskConical: <FlaskConical className="h-5 w-5" />,
    ShieldAlert: <ShieldAlert className="h-5 w-5" />,
    Droplet: <Droplet className="h-5 w-5" />,
    Info: <Info className="h-5 w-5" />,
};

const TrendIcon = ({ direction }: { direction: string }) => {
    switch (direction) {
        case 'Upward': return <ArrowUp className="h-4 w-4 text-green-500" />;
        case 'Downward': return <ArrowDown className="h-4 w-4 text-red-500" />;
        case 'Stable': return <Minus className="h-4 w-4 text-gray-500" />;
        case 'Volatile': return <BarChart className="h-4 w-4 text-yellow-500" />;
        default: return null;
    }
};

const postHarvestIcons: { [key: string]: React.ReactNode } = {
  storageRecommendations: <Warehouse className="h-5 w-5 text-primary" />,
  transportationOptions: <Truck className="h-5 w-5 text-primary" />,
  marketLinkages: <Store className="h-5 w-5 text-primary" />,
  valueAdditionOpportunities: <Sparkles className="h-5 w-5 text-primary" />,
  pricingStrategy: <BadgePercent className="h-5 w-5 text-primary" />,
  qualityControlMeasures: <Microscope className="h-5 w-5 text-primary" />,
  postHarvestHandling: <Package className="h-5 w-5 text-primary" />,
  wasteManagement: <Recycle className="h-5 w-5 text-primary" />,
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

export function CurrentCropAgent() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [crops, setCrops] = useState<CurrentCrop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [agentResponse, setAgentResponse] = useState<CurrentCropAgentOutput | null>(null);
  const [marketAnalysisResult, setMarketAnalysisResult] = useState<MarketAnalysisOutput | null>(null);
  const [postHarvestResult, setPostHarvestResult] = useState<PostHarvestOutput | null>(null);


  const addCropForm = useForm<AddCropFormValues>({
    resolver: zodResolver(addCropFormSchema),
    defaultValues: {
      cropName: '',
      fieldSize: '',
      location: user?.location || '',
      additionalInfo: '',
      sowingDate: undefined,
    },
  });

  const agentQueryForm = useForm<AgentQueryFormValues>({
    resolver: zodResolver(agentQueryFormSchema),
    defaultValues: {
        selectedCropId: '',
        query: '',
    },
  });

  const postHarvestYieldForm = useForm<PostHarvestYieldValues>({
      resolver: zodResolver(postHarvestYieldSchema),
      defaultValues: { yield: '' },
  });

  const fetchCrops = async () => {
    setLoadingCrops(true);
    try {
      const fetchedCrops = await getAllCurrentCrops();
      setCrops(fetchedCrops);
      if (fetchedCrops.length > 0) {
        agentQueryForm.setValue('selectedCropId', fetchedCrops[0].id);
      } else {
        agentQueryForm.setValue('selectedCropId', '');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your crops." });
    } finally {
      setLoadingCrops(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    if (user?.location) {
      addCropForm.setValue('location', user.location);
    }
  }, [user, addCropForm]);


  async function onAddCropSubmit(values: AddCropFormValues) {
    try {
      const newCropId = await addCurrentCrop({ 
          ...values, 
          location: user?.location || values.location, // Ensure location from profile is used
          sowingDate: values.sowingDate.toISOString() 
      });
      if (newCropId) {
        toast({ title: "Success", description: "Crop added successfully!" });
        addCropForm.reset();
        addCropForm.setValue('location', user?.location || '');
        setIsAddingCrop(false);
        await fetchCrops(); // Refresh the list
      } else {
         throw new Error("Failed to get new crop ID.");
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not add your crop." });
    }
  }

  const getSelectedCrop = () => {
    const values = agentQueryForm.getValues();
    const selectedCrop = crops.find(c => c.id === values.selectedCropId);
    if (!selectedCrop) {
      toast({ variant: "destructive", title: "Error", description: "Please select a crop first." });
      return null;
    }
    return selectedCrop;
  }

  const clearResults = () => {
      setAgentResponse(null);
      setMarketAnalysisResult(null);
      setPostHarvestResult(null);
  };

  async function onQuerySubmit() {
    const selectedCrop = getSelectedCrop();
    if (!selectedCrop) return;

    const query = agentQueryForm.getValues('query');
    if (!query || query.trim().length < 5) {
        agentQueryForm.setError("query", { type: "manual", message: "Please enter a question with at least 5 characters." });
        return;
    }

    setLoadingResponse(true);
    clearResults();
    try {
        const currentLanguageName = languages.find(l => l.code === locale)?.name.split(' ')[0] || 'English';
        const response = await askCurrentCropAgent({
            query: query,
            cropContext: selectedCrop,
            language: currentLanguageName
        });
        setAgentResponse(response);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Agent Error", description: "The agent could not process your request." });
    } finally {
        setLoadingResponse(false);
    }
  }

  async function handleMarketAnalysis() {
    const selectedCrop = getSelectedCrop();
    if (!selectedCrop) return;

    setLoadingResponse(true);
    clearResults();
    try {
        const currentLanguageName = languages.find(l => l.code === locale)?.name.split(' ')[0] || 'English';
        const result = await marketAnalysis({
            commodity: selectedCrop.cropName,
            location: selectedCrop.location,
            query: `Provide a market analysis for ${selectedCrop.cropName} in ${selectedCrop.location}`,
            language: currentLanguageName
        });
        setMarketAnalysisResult(result);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: 'Analysis Failed', description: 'Could not fetch market analysis.' });
    } finally {
        setLoadingResponse(false);
    }
  }

  async function handlePostHarvestHelp(yieldData: PostHarvestYieldValues) {
    const selectedCrop = getSelectedCrop();
    if (!selectedCrop) return;

    setLoadingResponse(true);
    clearResults();
    try {
        const currentLanguageName = languages.find(l => l.code === locale)?.name.split(' ')[0] || 'English';
        const result = await getPostHarvestAdvice({
            cropContext: selectedCrop,
            estimatedYield: yieldData.yield,
            language: currentLanguageName,
        });
        setPostHarvestResult(result);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: 'Analysis Failed', description: 'Could not fetch post-harvest advice.' });
    } finally {
        setLoadingResponse(false);
    }
  }

  const renderPostHarvestAdvice = (advice: PostHarvestOutput) => {
    const adviceEntries = [
        { key: 'storageRecommendations', title: 'Storage Recommendations' },
        { key: 'transportationOptions', title: 'Transportation Options' },
        { key: 'marketLinkages', title: 'Market Linkages' },
        { key: 'valueAdditionOpportunities', title: 'Value Addition Opportunities' },
        { key: 'pricingStrategy', title: 'Pricing Strategy' },
        { key: 'qualityControlMeasures', title: 'Quality Control Measures' },
        { key: 'postHarvestHandling', title: 'Post-Harvest Handling' },
        { key: 'wasteManagement', title: 'Waste Management' },
    ];
    
    return (
        <div className="mt-8 space-y-4">
            {advice.costingAnalysis && <CostingCard analysis={advice.costingAnalysis} />}
            <Accordion type="single" collapsible className="w-full" defaultValue="storageRecommendations">
                 {adviceEntries.map(item => (
                    <AccordionItem key={item.key} value={item.key}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-lg text-left">
                            {postHarvestIcons[item.key as keyof typeof postHarvestIcons]}
                            <span className="font-semibold">{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose prose-sm max-w-none pl-4 border-l-2 border-primary/20 ml-4">
                        <p>{advice[item.key as keyof PostHarvestOutput]}</p>
                      </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>
        </div>
    );
  };


  return (
    <Card className="shadow-lg border-primary/20 w-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Leaf className="text-primary" />
            {t('My Farm Assistant')}
        </CardTitle>
        <CardDescription>
            {t("Add the crops you're currently growing to get personalized AI-powered advice on them.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAddingCrop ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('Add a New Crop')}</h3>
            <Form {...addCropForm}>
              <form onSubmit={addCropForm.handleSubmit(onAddCropSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={addCropForm.control} name="cropName" render={({ field }) => (
                    <FormItem><FormLabel>{t('Crop Name*')}</FormLabel><FormControl><Input placeholder={t('e.g., Tomato')} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addCropForm.control} name="fieldSize" render={({ field }) => (
                    <FormItem><FormLabel>{t('Field Size*')}</FormLabel><FormControl><Input placeholder={t('e.g., 2 acres')} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={addCropForm.control} name="location" render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                  )} />
                  <FormField control={addCropForm.control} name="sowingDate" render={({ field }) => (
                     <FormItem className="flex flex-col"><FormLabel>{t('Sowing Date*')}</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>{t('Pick a date')}</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={addCropForm.control} name="additionalInfo" render={({ field }) => (
                    <FormItem><FormLabel>{t('Additional Info (Optional)')}</FormLabel><FormControl><Textarea placeholder={t('e.g., Using drip irrigation')} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={addCropForm.formState.isSubmitting}>
                    {addCropForm.formState.isSubmitting ? <Loader /> : t('Save Crop')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingCrop(false)}>{t('Cancel')}</Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsAddingCrop(true)}><PlusCircle className="mr-2" /> {t('Add New Crop')}</Button>
            </div>
            
            <Form {...agentQueryForm}>
                <form className="space-y-4">
                    <FormField control={agentQueryForm.control} name="selectedCropId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('Select a crop to ask about*')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCrops ? t("Loading crops...") : t("Select a crop")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {loadingCrops ? <SelectItem value="loading" disabled>{t("Loading crops...")}</SelectItem> :
                                     crops.length > 0 ? crops.map(crop => (
                                        <SelectItem key={crop.id} value={crop.id}>{crop.cropName} - {crop.location}</SelectItem>
                                     )) : <SelectItem value="no-crops" disabled>{t('No crops added yet.')}</SelectItem>
                                    }
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={agentQueryForm.control} name="query" render={({ field }) => (
                        <FormItem><FormLabel>{t('Your Question (Optional)')}</FormLabel><FormControl><Textarea placeholder={t('e.g., When should I apply fertilizer?')} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div className='flex flex-wrap gap-2'>
                        <Button type="button" onClick={onQuerySubmit} disabled={loadingResponse || crops.length === 0}><Sparkles className="mr-2" /> {t('Ask Agent')}</Button>
                        <Button type="button" variant="outline" onClick={handleMarketAnalysis} disabled={loadingResponse || crops.length === 0}><TrendingUp className="mr-2" /> {t('Get Market Analysis')}</Button>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="outline" disabled={loadingResponse || crops.length === 0}>
                                    <PackageSearch className="mr-2" /> {t('Get Post-Harvest Help')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <Form {...postHarvestYieldForm}>
                                    <form onSubmit={postHarvestYieldForm.handleSubmit(handlePostHarvestHelp)}>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>{t('Post-Harvest Advice')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('To give you the best advice, please provide an estimated yield for your selected crop.')}
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="py-4">
                                            <FormField control={postHarvestYieldForm.control} name="yield" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('Estimated Yield')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('e.g., 10 tonnes, 50 quintals')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                            <AlertDialogAction type="submit">{t('Get Advice')}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </form>
                                </Form>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </form>
            </Form>

            {loadingResponse && <div className="mt-6 flex justify-center"><Loader /></div>}

            {agentResponse && (
                <div className="mt-6 space-y-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Bot /> {t("Agent's Summary")}</CardTitle></CardHeader>
                        <CardContent><p>{agentResponse.summary}</p></CardContent>
                    </Card>
                    <div className="space-y-3">
                        {agentResponse.structuredAdvice.map((advice, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                        {advice.icon && adviceIcons[advice.icon]}
                                        {advice.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                                    <p>{advice.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {marketAnalysisResult && (
                 <div className="mt-8 space-y-6">
                 {marketAnalysisResult.costingAnalysis && <CostingCard analysis={marketAnalysisResult.costingAnalysis} />}
                 <Card className="bg-primary/5 border-primary/20">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Lightbulb/> {t('Actionable Insight')}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-lg font-semibold text-primary">{marketAnalysisResult.actionableInsight.recommendation}</p>
                     <p className="text-sm text-muted-foreground mt-1">{marketAnalysisResult.actionableInsight.reasoning}</p>
                   </CardContent>
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2"><DollarSign/> {t('Current Price')}</CardTitle>
                       <CardDescription>{marketAnalysisResult.corePriceInfo.currentPrice.market}</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <p className="text-3xl font-bold">{marketAnalysisResult.corePriceInfo.currentPrice.price} <span className="text-lg font-normal text-muted-foreground">{marketAnalysisResult.corePriceInfo.currentPrice.unit}</span></p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {t('Daily Range: %s - %s %s', marketAnalysisResult.corePriceInfo.dailyPriceRange.low, marketAnalysisResult.corePriceInfo.dailyPriceRange.high, marketAnalysisResult.corePriceInfo.dailyPriceRange.unit)}
                       </p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2"><TrendingUp/> {t('Price Trend')}</CardTitle>
                       <CardDescription>{marketAnalysisResult.historicalTrendAnalysis.priceTrend.period}</CardDescription>
                     </CardHeader>
                     <CardContent>
                         <div className="flex items-center gap-2">
                             <TrendIcon direction={marketAnalysisResult.historicalTrendAnalysis.priceTrend.direction} />
                             <p className="text-3xl font-bold">{marketAnalysisResult.historicalTrendAnalysis.priceTrend.direction}</p>
                         </div>
                         <p className={cn("text-sm font-semibold mt-1", marketAnalysisResult.historicalTrendAnalysis.priceChange.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                             {t('%s vs yesterday', `${marketAnalysisResult.historicalTrendAnalysis.priceChange.change.toFixed(2)} (${marketAnalysisResult.historicalTrendAnalysis.priceChange.percentageChange.toFixed(2)}%)`)}
                         </p>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2"><Scale/> {t('Market Dynamics')}</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-2">
                       <div className="flex items-center justify-between text-sm">
                             <span className="font-medium text-muted-foreground flex items-center gap-1"><ShoppingBasket size={14}/> {t('Supply')}</span>
                             <Badge variant="outline">{marketAnalysisResult.marketDynamics.supplyStatus.status}</Badge>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                             <span className="font-medium text-muted-foreground flex items-center gap-1"><Brain size={14}/> {t('Demand')}</span>
                             <Badge variant="outline">{marketAnalysisResult.marketDynamics.demandStatus.status}</Badge>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
                 
                 <Accordion type="single" collapsible className="w-full">
                   <AccordionItem value="item-1">
                     <AccordionTrigger>
                       <div className="flex items-center gap-2">
                         <Info className="h-5 w-5 text-primary" />
                         {t('Detailed Analysis & Data Source')}
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="prose prose-sm max-w-none space-y-4 dark:prose-invert">
                       <div>
                         <h4 className="font-semibold">{t('Overall Summary')}</h4>
                         <p>{marketAnalysisResult.marketSummary}</p>
                       </div>
                       <div>
                         <h4 className="font-semibold">{t('Supply Impact')}</h4>
                         <p>{marketAnalysisResult.marketDynamics.supplyStatus.impact}</p>
                       </div>
                       <div>
                         <h4 className="font-semibold">{t('Demand Impact')}</h4>
                         <p>{marketAnalysisResult.marketDynamics.demandStatus.impact}</p>
                       </div>
                       <div>
                         <h4 className="font-semibold">{t('Data Source')}</h4>
                         <p>
                           {marketAnalysisResult.additionalInfo.dataSource} as of {new Date(marketAnalysisResult.additionalInfo.lastUpdated).toLocaleString()}
                         </p>
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </div>
            )}

            {postHarvestResult && renderPostHarvestAdvice(postHarvestResult)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
