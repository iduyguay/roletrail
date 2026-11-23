import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firestoreClient.js'

function jobsCollection(uid) {
  return collection(db, 'users', uid, 'jobs')
}

export function subscribeToJobs(uid, onChange, onError) {
  return onSnapshot(jobsCollection(uid), (snapshot) => {
    const jobs = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
    jobs.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))
    onChange(jobs)
  }, onError)
}

export function createJob(uid, values) {
  return addDoc(jobsCollection(uid), {
    ...values,
    ownerId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateJob(uid, id, changes) {
  return updateDoc(doc(db, 'users', uid, 'jobs', id), {
    ...changes,
    updatedAt: serverTimestamp(),
  })
}

export function removeJob(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'jobs', id))
}
