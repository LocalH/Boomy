import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MidiBanks } from '../../components/MidiBanks';
import { useSongStore } from '../../store/songStore';
import { DrumsEvent } from '../../types/song';
import type { TimelineData } from './NewTimelineRoot';

const TRACK_COLORS = [
	'bg-red-500',
	'bg-blue-500',
	'bg-green-500',
	'bg-yellow-500',
	'bg-purple-500',
	'bg-pink-500',
	'bg-indigo-500',
	'bg-orange-500',
];

const STEP_WIDTH = 40; // px

export interface DrumsTimelineProps {
	timelineData: TimelineData;
	currentTime: number;
	isPlaying: boolean;
	autoScroll: boolean;
	calculateCursorPosition: (time?: number) => number;
	handleSeek: (time: number) => void;
	timeToBeat: (time: number) => number;
	timelineScrollRef: React.RefObject<HTMLDivElement>;
	pixelsPerBeat: number;
	trackHeaderWidth: number;
}

export const DrumsTimeline = React.memo(
	function DrumsTimeline({
		timelineData,
		currentTime,
		handleSeek,
		calculateCursorPosition,
		timelineScrollRef,
		pixelsPerBeat,
		trackHeaderWidth,
	}: DrumsTimelineProps) {
		const { currentSong, updateDrums } = useSongStore();
		const drumsEvents = useMemo(
			() => currentSong?.drums || [],
			[currentSong?.drums]
		);
		const [selectedTrackIndex, setSelectedTrackIndex] = useState<
			number | null
		>(null);
		const [showMidiBanks, setShowMidiBanks] = useState(false);

		const addBankAsTrack = useCallback(
			(bankName: string) => {
				if (drumsEvents.some((track) => track.sound === bankName)) {
					toast.error('Track already exists', {
						description: `A track named "${bankName}" is already in the timeline.`,
					});
					return;
				}
				const newTrack: DrumsEvent = { sound: bankName, events: [] };
				const newDrumsEvents = [...drumsEvents, newTrack];
				updateDrums(newDrumsEvents);
				setSelectedTrackIndex(newDrumsEvents.length - 1);
				setShowMidiBanks(false);
				toast('Track Added', {
					description: `Added "${bankName}" as a drum track.`,
				});
			},
			[drumsEvents, updateDrums]
		);

		const deleteTrack = useCallback(
			(index: number) => {
				const newDrumsEvents = drumsEvents.filter(
					(_, i) => i !== index
				);
				updateDrums(newDrumsEvents);
				if (selectedTrackIndex === index) {
					setSelectedTrackIndex(null);
				} else if (
					selectedTrackIndex !== null &&
					selectedTrackIndex > index
				) {
					setSelectedTrackIndex(selectedTrackIndex - 1);
				}
				toast('Track Deleted', {
					description: 'The track has been removed.',
				});
			},
			[drumsEvents, updateDrums, selectedTrackIndex]
		);

		const toggleEvent = useCallback(
			(trackIndex: number, beatIndex: number) => {
				const newDrumsEvents = JSON.parse(JSON.stringify(drumsEvents));
				const track = newDrumsEvents[trackIndex];
				const eventPos = track.events.indexOf(beatIndex);

				if (eventPos === -1) {
					track.events.push(beatIndex);
					track.events.sort((a: number, b: number) => a - b);
				} else {
					track.events.splice(eventPos, 1);
				}
				updateDrums(newDrumsEvents);
			},
			[drumsEvents, updateDrums]
		);

		const totalWidth = timelineData.measures.length * 8 * STEP_WIDTH;

		if (!currentSong) {
			return (
				<div className="p-4 text-center text-muted-foreground">
					Loading song...
				</div>
			);
		}

		return (
			<div className="h-full flex flex-col bg-background text-white">
				{/* Toolbar */}
				<div className="flex-shrink-0 p-2 border-b bg-background flex items-center justify-between">
					<Button size="sm" onClick={() => setShowMidiBanks(true)}>
						<Plus className="h-4 w-4 mr-1" /> Add Track
					</Button>
					<div className="text-sm text-muted-foreground">
						{drumsEvents.length} tracks
					</div>
				</div>

				{/* Timeline Content */}
				<div className="flex-1 relative overflow-hidden">
					{drumsEvents.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
							<Music className="h-12 w-12 mb-4 opacity-20" />
							<h3 className="text-lg font-medium mb-2">
								No Drum Tracks
							</h3>
							<p className="text-sm text-center mb-4">
								Add a track from MIDI banks to get started.
							</p>
							<Button onClick={() => setShowMidiBanks(true)}>
								<Music className="h-4 w-4 mr-1" /> Browse MIDI
								Banks
							</Button>
						</div>
					) : (
						<div
							className="h-full w-full overflow-auto"
							ref={timelineScrollRef}
						>
							<div
								className="relative"
								style={{ width: totalWidth }}
							>
								{/* Header */}
								<div className="sticky top-0 z-20 flex bg-background">
									<div className="sticky left-0 z-30 w-48 flex-shrink-0 bg-background border-r border-b flex items-center p-2">
										<span className="text-xs font-bold uppercase text-muted-foreground">
											Drum Tracks
										</span>
									</div>
									{timelineData.measures.map((measure) => (
										<div
											key={measure.number}
											className="flex flex-col border-r"
											style={{
												width: 8 * STEP_WIDTH,
												minWidth: 8 * STEP_WIDTH,
											}}
										>
											<div className="h-6 flex items-center justify-center border-b text-sm font-medium">
												Measure {measure.number}
											</div>
										</div>
									))}
								</div>

								{/* Body */}
								<div className="flex">
									{/* Track Info Column */}
									<div className="sticky left-0 z-10 w-48 flex-shrink-0 bg-background">
										{drumsEvents.map(
											(track, trackIndex) => (
												<div
													key={trackIndex}
													className={cn(
														'h-12 border-b border-r flex items-center justify-between px-2 cursor-pointer',
														selectedTrackIndex ===
															trackIndex
															? 'bg-accent'
															: 'hover:bg-muted/50'
													)}
													onClick={() =>
														setSelectedTrackIndex(
															trackIndex ===
																selectedTrackIndex
																? null
																: trackIndex
														)
													}
												>
													<div className="flex items-center gap-2 truncate">
														<div
															className={`w-3 h-3 rounded-full ${
																TRACK_COLORS[
																	trackIndex %
																		TRACK_COLORS.length
																]
															}`}
														/>
														<span className="text-sm truncate">
															{track.sound}
														</span>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-destructive/20"
														onClick={(e) => {
															e.stopPropagation();
															deleteTrack(
																trackIndex
															);
														}}
														title="Delete Track"
													>
														<Trash className="h-3 w-3 text-destructive" />
													</Button>
												</div>
											)
										)}
									</div>

									{/* Grid */}
									<div className="flex flex-col">
										{drumsEvents.map(
											(track, trackIndex) => (
												<div
													key={trackIndex}
													className="flex h-12 border-b"
												>
													{timelineData.measures.map(
														(_, measureIndex) => (
															<React.Fragment
																key={
																	measureIndex
																}
															>
																{Array.from({
																	length: 8,
																}).map(
																	(
																		__,
																		beatPosition
																	) => {
																		const beatIndex =
																			measureIndex *
																				8 +
																			beatPosition;
																		const hasEvent =
																			track.events.includes(
																				beatIndex
																			);
																		const isQuarter =
																			beatPosition %
																				2 ===
																			0;
																		return (
																			<div
																				key={
																					beatIndex
																				}
																				className={cn(
																					'w-10 h-full flex items-center justify-center border-r cursor-pointer',
																					isQuarter
																						? 'bg-muted/10'
																						: 'bg-transparent',
																					'hover:bg-muted/30'
																				)}
																				onClick={() =>
																					toggleEvent(
																						trackIndex,
																						beatIndex
																					)
																				}
																			>
																				{hasEvent && (
																					<div
																						className={`w-5 h-5 rounded-full ${
																							TRACK_COLORS[
																								trackIndex %
																									TRACK_COLORS.length
																							]
																						}`}
																					/>
																				)}
																			</div>
																		);
																	}
																)}
															</React.Fragment>
														)
													)}
												</div>
											)
										)}
									</div>
								</div>

								{/* Playhead */}
								<div
									className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
									style={{
										left: `${calculateCursorPosition(
											currentTime
										)}px`,
									}}
								/>
							</div>
						</div>
					)}
				</div>

				{/* MIDI Banks Dialog */}
				<Dialog open={showMidiBanks} onOpenChange={setShowMidiBanks}>
					<DialogContent className="max-w-3xl h-[80vh]">
						<DialogHeader>
							<DialogTitle>Add Track from MIDI Bank</DialogTitle>
							<DialogDescription>
								Click on a bank name to add it as a new drum
								track.
							</DialogDescription>
						</DialogHeader>
						<div className="flex-1 overflow-hidden">
							<MidiBanks
								onAddBankAsDrumTrack={addBankAsTrack}
								className="h-[calc(80vh-100px)]"
							/>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison function to prevent unnecessary re-renders
		// Only re-render when these specific props change
		return (
			prevProps.currentTime === nextProps.currentTime &&
			prevProps.isPlaying === nextProps.isPlaying &&
			prevProps.autoScroll === nextProps.autoScroll &&
			// Deep comparison of timelineData would be expensive, so compare just measures length
			prevProps.timelineData.measures.length ===
				nextProps.timelineData.measures.length
		);
	}
);
