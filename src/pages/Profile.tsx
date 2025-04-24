import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, Button, TextField, CircularProgress, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { toast } from 'react-hot-toast';
import { PhotoCamera, Edit as EditIcon } from '@mui/icons-material';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    phoneNumber: '',
    location: '',
    level: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            phoneNumber: userData.phoneNumber || '',
            location: userData.location || '',
            level: userData.level || '',
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      }
    };

    loadUserData();
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user) return;

    const file = event.target.files[0];
    setUploadingImage(true);

    try {
      const storage = getStorage();
      const imageRef = ref(storage, `profile-images/${user.uid}/${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      toast.success('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update auth profile
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        level: formData.level,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!user) return null;

  const renderField = (label: string, value: string) => (
    <div className="mb-4">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white">{value || '-'}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1A1A1A] rounded-xl overflow-hidden shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="contained"
                startIcon={<EditIcon />}
                sx={{
                  backgroundColor: '#C1FF2F',
                  color: '#000',
                  '&:hover': { backgroundColor: '#aee62a' },
                }}
              >
                Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative">
                  <Avatar
                    src={formData.photoURL}
                    alt={formData.displayName}
                    sx={{ width: 100, height: 100, bgcolor: '#333' }}
                  />
                  <Button
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      padding: 0,
                      backgroundColor: '#C1FF2F',
                      '&:hover': { backgroundColor: '#aee62a' },
                    }}
                  >
                    {uploadingImage ? (
                      <CircularProgress size={24} sx={{ color: '#000' }} />
                    ) : (
                      <PhotoCamera sx={{ color: '#000' }} />
                    )}
                    <input
                      ref={fileInputRef}
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  fullWidth
                  label="Display Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleTextChange}
                  required
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: '#fff' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#777' },
                      '&.Mui-focused fieldset': { borderColor: '#C1FF2F' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  disabled
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: '#fff' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleTextChange}
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: '#fff' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#777' },
                      '&.Mui-focused fieldset': { borderColor: '#C1FF2F' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleTextChange}
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: '#fff' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#555' },
                      '&:hover fieldset': { borderColor: '#777' },
                      '&.Mui-focused fieldset': { borderColor: '#C1FF2F' },
                    },
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel id="level-label" sx={{ color: '#aaa' }}>Game Level</InputLabel>
                  <Select
                    labelId="level-label"
                    name="level"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    label="Game Level"
                    sx={{
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C1FF2F' },
                      '& .MuiSvgIcon-root': { color: '#fff' },
                    }}
                  >
                    <MenuItem value="">Select your level</MenuItem>
                    {LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  onClick={() => setIsEditing(false)}
                  sx={{ color: '#aaa' }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: '#C1FF2F',
                    color: '#000',
                    '&:hover': { backgroundColor: '#aee62a' },
                    '&.Mui-disabled': { backgroundColor: '#555', color: '#888' }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{color: '#000'}} /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex flex-col items-center mb-8">
                <Avatar
                  src={formData.photoURL}
                  alt={formData.displayName}
                  sx={{ width: 100, height: 100, bgcolor: '#333', mb: 2 }}
                />
                <h2 className="text-xl font-semibold">{formData.displayName}</h2>
                <p className="text-gray-400">{formData.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('Phone Number', formData.phoneNumber)}
                {renderField('Location', formData.location)}
                {renderField('Game Level', formData.level)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 