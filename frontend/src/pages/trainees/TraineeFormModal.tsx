import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { traineesApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Trainee } from '../../types';

interface TraineeFormModalProps {
  trainee?: Trainee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const QUALIFICATIONS = [
  'High School (10th)', 'Higher Secondary (12th)', 'Diploma / Polytechnic',
  'Bachelor of Science (B.Sc)', 'Bachelor of Technology (B.Tech / B.E.)',
  'Bachelor of Arts (B.A.)', 'Bachelor of Commerce (B.Com)', 'Master of Science (M.Sc)',
  'Master of Technology (M.Tech)', 'Doctor of Philosophy (Ph.D)', 'Post Doctorate', 'Other'
];

const TraineeFormModal: React.FC<TraineeFormModalProps> = ({ trainee, onClose, onSuccess }) => {
  const isEdit = Boolean(trainee);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    defaultValues: trainee ? {
      firstName: trainee.firstName,
      lastName: trainee.lastName,
      dateOfBirth: trainee.dateOfBirth ? trainee.dateOfBirth.split('T')[0] : '',
      gender: trainee.gender,
      socialCategory: trainee.socialCategory,
      isMinority: trainee.isMinority,
      isPWD: trainee.isPWD,
      pwdType: trainee.pwdType || '',
      domicileType: trainee.domicileType,
      email: trainee.email,
      phone: trainee.phone,
      alternatePhone: trainee.alternatePhone || '',
      'address.street': trainee.address?.street || '',
      'address.city': trainee.address?.city || '',
      'address.district': trainee.address?.district || '',
      'address.state': trainee.address?.state || 'Uttar Pradesh',
      'address.pincode': trainee.address?.pincode || '',
      highestQualification: trainee.highestQualification,
      specialization: trainee.specialization || '',
      institution: trainee.institution || '',
      employmentStatus: trainee.employmentStatus,
      organization: trainee.organization || '',
      designation: trainee.designation || '',
    } : {
      gender: 'Male',
      socialCategory: 'General',
      isMinority: false,
      isPWD: false,
      domicileType: 'Urban',
      'address.state': 'Uttar Pradesh',
      employmentStatus: 'Student',
      highestQualification: 'Bachelor of Technology (B.Tech / B.E.)',
    },
  });

  const isPWDChecked = watch('isPWD');

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      // Nest the address object properly
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        socialCategory: data.socialCategory,
        isMinority: Boolean(data.isMinority),
        isPWD: Boolean(data.isPWD),
        pwdType: data.isPWD ? data.pwdType : undefined,
        domicileType: data.domicileType,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone || undefined,
        address: {
          street: data['address.street'],
          city: data['address.city'],
          district: data['address.district'],
          state: data['address.state'],
          pincode: data['address.pincode'],
        },
        highestQualification: data.highestQualification,
        specialization: data.specialization || undefined,
        institution: data.institution || undefined,
        employmentStatus: data.employmentStatus,
        organization: data.organization || undefined,
        designation: data.designation || undefined,
      };

      if (isEdit && trainee) {
        return traineesApi.update(trainee._id, payload);
      }
      return traineesApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Trainee updated successfully' : 'Trainee registered successfully');
      onSuccess();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const onSubmit = (formData: any) => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? `Edit Trainee (${trainee?.traineeId})` : 'Register New Trainee'}
          </h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Personal Details Section */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-light)', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                1. Personal Details
              </h4>
              <div className="grid grid-2" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    className="form-control"
                    {...register('firstName', { required: 'First name is required' })}
                    placeholder="e.g. Ramesh"
                  />
                  {errors.firstName && <span className="form-error">{String(errors.firstName.message)}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    className="form-control"
                    {...register('lastName', { required: 'Last name is required' })}
                    placeholder="e.g. Kumar"
                  />
                  {errors.lastName && <span className="form-error">{String(errors.lastName.message)}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="trainee@domain.com"
                  />
                  {errors.email && <span className="form-error">{String(errors.email.message)}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    className="form-control"
                    {...register('phone', { required: 'Phone is required' })}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && <span className="form-error">{String(errors.phone.message)}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-control" {...register('dateOfBirth')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-control" {...register('gender', { required: true })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Demographics & Inclusion */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-light)', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                2. Demographics & Inclusion
              </h4>
              <div className="grid grid-3" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Social Category *</label>
                  <select className="form-control" {...register('socialCategory')}>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Area (Domicile) *</label>
                  <select className="form-control" {...register('domicileType')}>
                    <option value="Rural">Rural</option>
                    <option value="Urban">Urban</option>
                    <option value="Semi-Urban">Semi-Urban</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input type="checkbox" {...register('isMinority')} />
                    <span>Belongs to Minority Community</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" {...register('isPWD')} />
                  <span>Person with Disability (PWD)</span>
                </label>

                {isPWDChecked && (
                  <div style={{ flex: 1 }}>
                    <input
                      className="form-control"
                      placeholder="Disability Type / Percentage"
                      {...register('pwdType')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-light)', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                3. Address Information
              </h4>
              <div className="grid grid-2" style={{ gap: '14px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Street / House Address</label>
                  <input className="form-control" placeholder="Door No, Street Name" {...register('address.street')} />
                </div>

                <div className="form-group">
                  <label className="form-label">City / Town</label>
                  <input className="form-control" placeholder="City" {...register('address.city')} />
                </div>

                <div className="form-group">
                  <label className="form-label">District</label>
                  <input className="form-control" placeholder="District" {...register('address.district')} />
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <select className="form-control" {...register('address.state', { required: true })}>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input className="form-control" placeholder="6-digit PIN" {...register('address.pincode')} />
                </div>
              </div>
            </div>

            {/* Academic & Employment Details */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-light)', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                4. Education & Employment
              </h4>
              <div className="grid grid-2" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Highest Qualification *</label>
                  <select className="form-control" {...register('highestQualification')}>
                    {QUALIFICATIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization / Branch</label>
                  <input className="form-control" placeholder="e.g. Computer Science, Biotechnology" {...register('specialization')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Institution / College</label>
                  <input className="form-control" placeholder="Institute / University name" {...register('institution')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Status *</label>
                  <select className="form-control" {...register('employmentStatus')}>
                    <option value="Student">Student</option>
                    <option value="Employed - CSIR">Employed - CSIR</option>
                    <option value="Employed - Govt / PSU">Employed - Govt / PSU</option>
                    <option value="Employed - Private">Employed - Private</option>
                    <option value="Faculty / Academician">Faculty / Academician</option>
                    <option value="Research Scholar">Research Scholar</option>
                    <option value="Self-Employed / Entrepreneur">Self-Employed / Entrepreneur</option>
                    <option value="Unemployed / Seeking Placement">Unemployed / Seeking Placement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Organization / Lab</label>
                  <input className="form-control" placeholder="e.g. CSIR-HRDC Ghaziabad" {...register('organization')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <input className="form-control" placeholder="e.g. Junior Research Fellow" {...register('designation')} />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saveMutation.isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
              <Save size={16} />
              {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Trainee' : 'Save Trainee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraineeFormModal;
