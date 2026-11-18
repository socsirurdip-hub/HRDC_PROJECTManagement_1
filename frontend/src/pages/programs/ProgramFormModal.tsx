import React from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { programsApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import type { TrainingProgram, ProgramFormData } from '../../types';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technical Training', 'Leadership Development', 'Soft Skills', 'Compliance', 'Safety', 'Research Methodology', 'IT & Digital Skills', 'Management Development', 'Other'];
const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry','Chandigarh'];

interface Props {
  program: TrainingProgram | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProgramFormModal: React.FC<Props> = ({ program, onClose, onSuccess }) => {
  const isEdit = !!program;

  const { register, handleSubmit, formState: { errors } } = useForm<ProgramFormData>({
    defaultValues: program ? {
      programCode: program.programCode,
      title: program.title,
      description: program.description,
      category: program.category,
      mode: program.mode,
      venue: program.venue,
      state: program.state,
      district: program.district,
      startDate: program.startDate?.split('T')[0],
      endDate: program.endDate?.split('T')[0],
      coordinatorName: program.coordinatorName,
      coordinatorEmail: program.coordinatorEmail,
      targetAudience: program.targetAudience,
      maxParticipants: program.maxParticipants,
      status: program.status,
      outcomes: program.outcomes,
      allowNominations: program.allowNominations || false,
      nominationStartDate: program.nominationStartDate?.split('T')[0],
      nominationEndDate: program.nominationEndDate?.split('T')[0],
      hasBatches: program.hasBatches || false,
    } : {
      mode: 'Offline',
      status: 'Scheduled',
      maxParticipants: 50,
      allowNominations: true,
      hasBatches: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? programsApi.update(program!._id, data) : programsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Program updated successfully' : 'Program created successfully');
      onSuccess();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = (data: ProgramFormData) => {
    mutation.mutate(data as unknown as Record<string, unknown>);
  };

  return createPortal(
    <div className="modal-overlay" id="program-modal-overlay" onClick={onClose}>
      <div
        className="modal"
        id="program-form-modal"
        style={{ maxWidth: '760px', maxHeight: 'calc(100vh - 40px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Training Program' : 'Add Training Program'}</h3>
          <button className="modal-close" onClick={onClose} id="close-program-modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Program Code <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.programCode ? 'error' : ''}`}
                  id="programCode"
                  placeholder="e.g. HRDC-2024-006"
                  {...register('programCode', { required: 'Program code is required' })}
                />
                {errors.programCode && <p className="form-error">{errors.programCode.message}</p>}
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Program Title <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.title ? 'error' : ''}`}
                  id="programTitle"
                  placeholder="Full title of the training program"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category <span className="required">*</span></label>
                <select className={`form-control ${errors.category ? 'error' : ''}`} id="category" {...register('category', { required: true })}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mode <span className="required">*</span></label>
                <select className="form-control" id="mode" {...register('mode', { required: true })}>
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" id="status" {...register('status')}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Postponed">Postponed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date <span className="required">*</span></label>
                <input type="date" className="form-control" id="startDate" {...register('startDate', { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date <span className="required">*</span></label>
                <input type="date" className="form-control" id="endDate" {...register('endDate', { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Participants</label>
                <input type="number" className="form-control" id="maxParticipants" {...register('maxParticipants', { min: 1 })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-control" id="state" {...register('state')}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-control" id="district" placeholder="District / City" {...register('district')} />
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <input className="form-control" id="venue" placeholder="Venue name" {...register('venue')} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Coordinator Name</label>
                <input className="form-control" id="coordinatorName" {...register('coordinatorName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Coordinator Email</label>
                <input type="email" className="form-control" id="coordinatorEmail" {...register('coordinatorEmail')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <input className="form-control" id="targetAudience" placeholder="Who is this program for?" {...register('targetAudience')} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" id="description" rows={3} placeholder="Brief description of the program" {...register('description')} />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Outcomes</label>
              <textarea className="form-control" id="outcomes" rows={2} placeholder="What participants will learn..." {...register('outcomes')} />
            </div>

            {/* Nomination & Batch Settings */}
            <div style={{
              background: 'rgba(200, 150, 62, 0.05)',
              border: '1px solid rgba(200, 150, 62, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Nominations & Batch Cohort Settings
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                  <input type="checkbox" {...register('allowNominations')} />
                  <strong>Allow Participant Nominations</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                  <input type="checkbox" {...register('hasBatches')} />
                  <strong>Enable Staggered / Multi-Batch Cohorts</strong>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nomination Window Start Date</label>
                  <input type="date" className="form-control" id="nominationStartDate" {...register('nominationStartDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomination Window End Date</label>
                  <input type="date" className="form-control" id="nominationEndDate" {...register('nominationEndDate')} />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} id="cancel-program-modal">Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-program-btn" disabled={mutation.isPending}>
              <Save size={14} />
              {mutation.isPending ? 'Saving...' : (isEdit ? 'Update Program' : 'Create Program')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProgramFormModal;
