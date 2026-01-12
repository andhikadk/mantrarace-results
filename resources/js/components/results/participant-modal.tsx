import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import { type Participant } from './participant-card';
import { RankBadge } from './rank-badge';

interface Props {
    participant: Participant | null;
    open: boolean;
    onClose: () => void;
    eventSlug: string;
    categorySlug: string;
    certificateEnabled?: boolean;
}

export function ParticipantModal({ participant, open, onClose, eventSlug, categorySlug, certificateEnabled }: Props) {
    if (!participant) return null;

    const isFinished = participant.status?.toUpperCase() === 'FINISHED' ||
        (participant.finishTime && !['DNF', 'DNS'].includes(participant.status?.toUpperCase()));

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <RankBadge rank={participant.overallRank} />
                        <span>{participant.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-slate-500">BIB</div>
                            <div className="font-mono font-semibold">{participant.bib}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Overall Rank</div>
                            <div className="font-semibold">#{participant.overallRank}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Gender Rank</div>
                            <div className="font-semibold">#{participant.genderRank} ({participant.gender})</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Nation</div>
                            <div className="font-semibold">{participant.nation}</div>
                        </div>
                        {participant.club && (
                            <div className="col-span-2">
                                <div className="text-slate-500">Club</div>
                                <div className="font-semibold">{participant.club}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-slate-500">Finish Time</div>
                            <div className="font-mono font-semibold text-lg">
                                {participant.finishTime || '-'}
                            </div>
                        </div>
                        {participant.netTime && (
                            <div>
                                <div className="text-slate-500">Net Time</div>
                                <div className="font-mono font-semibold">{participant.netTime}</div>
                            </div>
                        )}
                    </div>

                    {participant.checkpoints.length > 0 && (
                        <div>
                            <h4 className="mb-3 font-semibold text-slate-900">Checkpoint Splits</h4>
                            <div className="space-y-2">
                                {participant.checkpoints.map((cp, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <div className="font-medium">{cp.name}</div>
                                            {cp.segment && (
                                                <div className="text-xs text-slate-500">
                                                    Segment: {cp.segment}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-semibold">
                                                {cp.time || '-'}
                                            </div>
                                            <div className="flex gap-2 text-xs text-slate-500">
                                                {cp.overallRank && <span>#{cp.overallRank}</span>}
                                                {cp.genderRank && <span>GR #{cp.genderRank}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isFinished && certificateEnabled && (
                        <div className="border-t pt-4">
                            <Button asChild className="w-full">
                                <a
                                    href={`/${eventSlug}/categories/${categorySlug}/certificate/${participant.bib}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
