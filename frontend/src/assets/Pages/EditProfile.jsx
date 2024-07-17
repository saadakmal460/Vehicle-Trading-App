import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../../firebase';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileProgress, setFileProgress] = useState(0);
    const [fileUploadError, setFileUploadError] = useState(null);
    const { currentUser } = useSelector((state) => state.user);
    const [user, setUser] = useState(null);
    const fileRef = useRef(null);
    const [file, setFile] = useState(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        const resolveUser = async () => {
            if (currentUser && currentUser instanceof Promise) {
                const result = await currentUser;

                setUser(result);
            } else {
                setUser(currentUser);
            }
        };
        resolveUser();
    }, [currentUser]);

    if (loading) {
        return <div>Loading...</div>;
    }

    useEffect(() => {
        if (file) {
            handleFileUpload(file);
        }
    }, [file]);

    const handleFileUpload = (file) => {
        const storage = getStorage(app);
        const fileName = new Date().getTime() + file.name;
        const fileRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setFileProgress(Math.round(progress));

        }, (error) => {
            setFileUploadError(true);
        }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl) => {
                setFormData((prevFormData) => ({ ...prevFormData, avatar: downloadUrl }));
            })
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log(formData)
        
    }

    return (
        <div className='p-3 max-w-lg mx-auto'>
            <h1 className='text-3xl font-semibold my-7 text-center'>Edit Profile</h1>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <input type="file" name="" id="" hidden ref={fileRef} accept='image/*' onChange={(e) => setFile(e.target.files[0])} />
                <img onClick={() => fileRef.current.click()} src={formData.avatar || (user ? user.avatar : '')} alt="" className='rounded-full h-24 w-24 object-cover cursor-pointer self-center m-2' />
                <p className='text-sm self-center'>{fileUploadError ? <span className='text-red-500'>Error Uploading File</span> : fileProgress > 0 && fileProgress < 100 ? (<span className='text-slate-500'>{`Uploading ${fileProgress}%`}</span>) : fileProgress === 100 ? (<span className='text-green-600'>File Uploaded Sucessfully</span>) : "" }</p>
                <input type="text" className='border p-3 rounded-lg' placeholder='Username' id='username' defaultValue={user && user.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                <input type="email" className='border p-3 rounded-lg' placeholder='Email' id='email' defaultValue={user && user.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <input type="password" className='border p-3 rounded-lg' placeholder='Password' id='password' onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button className='bg-slate-700 text-white rounded-lg uppercase p-3 hover:opacity-90 disabled:opacity-80' disabled={loading}>{loading ? 'Updating' : 'Update'}</button>
            </form>
        </div>
    )
}

export default EditProfile;
