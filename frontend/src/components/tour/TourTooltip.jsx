import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTour } from '../../context/TourContext';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const TourTooltip = ({ cutout }) => {
    const {
        currentStep,
        currentStepIndex,
        totalSteps,
        isLastStep,
        currentPageKey,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
    } = useTour();

    // Track when the step index changes to apply smooth transition only on step changes.
    // If the step index has not changed, coordinate updates are due to scrolling/resizing,
    // so we disable the transition delay to lock the tooltip position instantaneously.
    const lastStepIndexRef = useRef(currentStepIndex);
    const stepChanged = lastStepIndexRef.current !== currentStepIndex;

    useEffect(() => {
        lastStepIndexRef.current = currentStepIndex;
    }, [currentStepIndex]);

    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!cutout) return;

        const padding = 16;
        const tooltipWidth = 320;
        const tooltipHeight = 200;

        const placement = currentStep.placement || 'bottom';

        let top = cutout.y + cutout.h + padding;
        let left = cutout.x + cutout.w / 2 - tooltipWidth / 2;

        if (placement === 'right') {
            left = cutout.x + cutout.w + padding;
            top = cutout.y + cutout.h / 2 - tooltipHeight / 2;
        } else if (placement === 'left') {
            left = cutout.x - tooltipWidth - padding;
            top = cutout.y + cutout.h / 2 - tooltipHeight / 2;
        } else if (placement === 'top') {
            top = cutout.y - tooltipHeight - padding;
            left = cutout.x + cutout.w / 2 - tooltipWidth / 2;
        } else {
            // default 'bottom' placement
            top = cutout.y + cutout.h + padding;
            left = cutout.x + cutout.w / 2 - tooltipWidth / 2;

            // Flip above if it would go off-screen at bottom
            if (top + tooltipHeight > window.innerHeight - padding) {
                top = cutout.y - tooltipHeight - padding;
            }
        }

        // Clamp vertically to prevent going off-screen
        if (top < padding) {
            top = padding;
        }
        if (top + tooltipHeight > window.innerHeight - padding) {
            top = window.innerHeight - tooltipHeight - padding;
        }

        // Clamp horizontally
        if (left < padding) {
            left = padding;
        }
        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }

        setTooltipPos({ top, left });
    }, [cutout, currentStep]);

    if (!currentStep) return null;

    return (
        <motion.div
            data-tour-id="tour-tooltip"
            animate={{ top: tooltipPos.top, left: tooltipPos.left }}
            transition={
                stepChanged
                    ? { type: 'spring', bounce: 0, duration: 0.4 }
                    : { type: 'tween', ease: 'linear', duration: 0 }
            }
            className="absolute z-[10000] w-[320px] bg-slate-900 dark:bg-[#0d1117] border border-slate-700/60 shadow-2xl rounded-xl p-5 text-slate-200 flex flex-col gap-3 pointer-events-auto"
            style={{ fontSize: '13px' }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                    </div>
                    <h3 className="font-semibold text-sm text-white tracking-tight truncate">
                        {currentStep.title}
                    </h3>
                </div>
                <button
                    onClick={skipTour}
                    className="text-slate-400 hover:text-white transition-colors shrink-0 p-0.5 rounded"
                    title="Skip tour (will restart next login)"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Step dots */}
            <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            i === currentStepIndex
                                ? 'bg-indigo-500 flex-1'
                                : i < currentStepIndex
                                ? 'bg-indigo-800 w-4'
                                : 'bg-slate-700 w-4'
                        }`}
                    />
                ))}
            </div>

            {/* Description */}
            <p className="text-slate-300 leading-relaxed text-[13px]">
                {currentStep.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-1">
                <button
                    onClick={skipTour}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Skip for now
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={prevStep}
                        disabled={currentStepIndex === 0}
                        className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-300"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {isLastStep && !currentStep.onNext ? (
                        <button
                            onClick={() => completeTour(currentPageKey)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-colors"
                        >
                            <Check size={13} />
                            Finish
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (currentStep.onNext) {
                                    currentStep.onNext();
                                } else {
                                    nextStep();
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-colors"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default TourTooltip;
