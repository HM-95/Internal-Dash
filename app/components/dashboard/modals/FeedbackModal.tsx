"use client";
import React, { useState } from 'react';
import { X, MessageSquare, Tag, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (toast: { type: 'success' | 'error'; title: string; message: string }) => void;
}

export function FeedbackModal({ isOpen, onClose, onNotify }: FeedbackModalProps) {
  if (!isOpen) return null;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const messageMax = 500;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClasses = "w-full pl-10 pr-3 py-2 rounded-[10px] bg-[#0f1419] border border-[#374151] text-[#f9fafb] placeholder-[#6b7280] outline-none focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] active:bg-[#0f1419] active:border-[#3b82f6]";
  const textareaClasses = "w-full min-h-[140px] pl-10 pr-3 py-2 rounded-[10px] bg-[#0f1419] border border-[#374151] text-[#f9fafb] placeholder-[#6b7280] outline-none focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] active:bg-[#0f1419] active:border-[#3b82f6] resize-y";

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user_id = session?.user?.id;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: subject.trim(), 
          message: message.trim(),
          metadata: { source: 'dashboard_feedback_modal' }
        })
      });
      if (!res.ok) throw new Error('Failed to send feedback');

      setSubject('');
      setMessage('');
      onNotify?.({ type: 'success', title: 'Feedback sent', message: 'Thanks! Your feedback has been submitted.' });
      onClose();
    } catch (err) {
      console.error(err);
      onNotify?.({ type: 'error', title: 'Something went wrong', message: 'Please try again in a moment.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-[#1f2937] text-[#f9fafb] border border-[#374151] rounded-2xl shadow-2xl shadow-black/40 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#374151]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#0f1419] ring-1 ring-[#374151]">
              <MessageSquare className="w-5 h-5 text-[#557EDD]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#f9fafb]">Send Feedback</h2>
              <p className="text-sm text-[#9ca3af]">Help us improve Buzzberry</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-[#9ca3af] hover:bg-[#374151]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#9ca3af]">Subject</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short, descriptive subject"
                className={inputClasses}
              />
            </div>
            <p className="text-xs text-[#6b7280]">E.g., "Idea: quicker list editing" or "Bug: cannot save filters"</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#9ca3af]">Your Feedback</label>
            <div className="relative">
              <MessageSquareText className="absolute left-3 top-3 w-4 h-4 text-[#9ca3af]" />
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, messageMax))}
                maxLength={messageMax}
                placeholder="Tell us what you think..."
                className={textareaClasses}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6b7280]">Constructive details help us fix issues faster.</p>
              <span className="text-xs text-[#9ca3af]">{message.length}/{messageMax}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#374151] text-[#f9fafb] bg-[#0f1419]/60 hover:bg-[#0f1419] hover:text-[#f9fafb] rounded-[10px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="flex-1 bg-[#557EDD] hover:bg-[#1e40af] text-white focus:ring-2 focus:ring-[#3b82f6] rounded-[10px] shadow-lg shadow-black/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending…' : 'Send Feedback'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}