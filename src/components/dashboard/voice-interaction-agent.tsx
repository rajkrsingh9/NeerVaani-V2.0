
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { routeVoiceQuery } from '@/ai/flows/voice-agent-router-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { languages } from '@/lib/i18n';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Mic, Bot, CircleDashed, LinkIcon, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';

const AgentBadge = ({ agent }: { agent?: string }) => {
    if (!agent || agent === 'fallback') return null;
    return <Badge variant="secondary" className="capitalize">{agent.replace(/([A-Z])/g, ' $1')}</Badge>;
};

export function VoiceInteractionAgent() {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [agentResponse, setAgentResponse] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [agentUsed, setAgentUsed] = useState<string | undefined>('');
  const [sourceLink, setSourceLink] = useState<string | undefined>('');

  const [loading, setLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTranscript = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setAgentResponse('');
    setActionTaken(`Thinking about: "${text}"`);
    stopCurrentAudio();

    try {
      const currentLanguageName = languages.find(l => l.code === locale)?.name.split(' ')[0] || 'English';
      
      const { agentResponse: responseText, actionTaken, agentUsed, sourceLink } = await routeVoiceQuery({ 
        query: text,
        language: currentLanguageName
      });
      
      setAgentResponse(responseText);
      setActionTaken(actionTaken);
      setAgentUsed(agentUsed);
      setSourceLink(sourceLink);

      await speak(responseText);

    } catch (error: any) {
      console.error("Voice agent error:", error);
      const errorMessage = "Sorry, I encountered an error. Please try again.";
      setAgentResponse(errorMessage);
      setActionTaken("Error");
      setAgentUsed('fallback');
      toast({ variant: 'destructive', title: 'Error', description: t('An unexpected error occurred.') });
    } finally {
      setLoading(false);
    }
  };

  const { isRecording, startRecording, stopRecording } = useSpeechToText({ onTranscript: handleTranscript });

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => stopCurrentAudio(); // Cleanup on unmount
  }, []);

  const speak = async (text: string) => {
    stopCurrentAudio();
    if (!text.trim()) return;

    try {
        const { audioDataUri } = await textToSpeech({ text });
        if (audioDataUri) {
          const audio = new Audio(audioDataUri);
          audioRef.current = audio;
          
          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => setIsPlaying(false);
          audio.onpause = () => setIsPlaying(false);
          
          await audio.play();
        }
    } catch (error) {
        console.error("TTS error:", error);
        toast({
            variant: "destructive",
            title: "Text-to-Speech Failed",
            description: "Could not generate audio for the response."
        });
    }
  };

  const getButtonState = () => {
    if (loading) return 'loading';
    if (isRecording) return 'recording';
    return 'idle';
  };

  const buttonState = getButtonState();

  const buttonContent: Record<string, React.ReactNode> = {
    idle: <Mic className="h-10 w-10" />,
    recording: <Mic className="h-10 w-10" />,
    loading: <Loader className="h-10 w-10" />,
  };
  
  return (
    <Card className="shadow-lg h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Bot /> {t('NeerVaani Voice Assistant')}
        </CardTitle>
        <CardDescription>{t('Click the mic and ask me anything about your farm.')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1 text-center p-6">
        <div className="relative">
          <CircleDashed className={cn("h-48 w-48 text-primary/20", (buttonState === 'recording' || buttonState === 'loading') && 'animate-spin-slow')}/>
          <button
            onClick={() => {
              if (buttonState === 'idle') startRecording();
              else if (buttonState === 'recording') stopRecording();
            }}
            disabled={buttonState === 'loading'}
            className={cn(
                "absolute inset-0 m-auto h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out",
                "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50",
                buttonState === 'recording' && "scale-110 bg-destructive shadow-2xl animate-pulse"
            )}
            aria-label={buttonState === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            {buttonContent[buttonState]}
          </button>
        </div>

        <div className="mt-8 h-24 flex flex-col justify-center items-center">
            {agentResponse ? (
                <p className="text-lg font-medium text-foreground">{agentResponse}</p>
            ) : (
                <p className="text-muted-foreground">{isRecording ? "Listening..." : "Click the mic to start"}</p>
            )}
        </div>

        <div className="flex items-center gap-4 mt-4 h-8">
            {isPlaying && (
                <Button variant="ghost" size="icon" onClick={stopCurrentAudio}><VolumeX className="h-5 w-5"/></Button>
            )}
            {agentResponse && !isPlaying && (
                 <Button variant="ghost" size="icon" onClick={() => speak(agentResponse)}><Volume2 className="h-5 w-5"/></Button>
            )}
            <AgentBadge agent={agentUsed} />
            {sourceLink && (
              <Button asChild variant="link">
                <Link href={sourceLink}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  View in NeerHub
                </Link>
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
