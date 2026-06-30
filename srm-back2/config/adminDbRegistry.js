import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { Review } from '../models/Review.js';
import { ReviewerReview } from '../models/ReviewerReview.js';
import { ReviewerAssignment } from '../models/ReviewerAssignment.js';
import { ReReview } from '../models/ReReview.js';
import { Revision } from '../models/Revision.js';
import { RevisionReview } from '../models/RevisionReview.js';
import { ReviewerMessage } from '../models/ReviewerMessage.js';
import { PaperMessage } from '../models/PaperMessage.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { Copyright } from '../models/Copyright.js';
import PaymentRegistration from '../models/PaymentRegistration.js';
import { PaymentDoneFinalUser } from '../models/PaymentDoneFinalUser.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import RejectedPaper from '../models/RejectedPaper.js';
import ConferenceSelectedUser from '../models/ConferenceSelectedUser.js';
import ListenerRegistration from '../models/ListenerRegistration.js';
import Committee from '../models/Committee.js';
import CommitteeMember from '../models/CommitteeMember.js';

/**
 * All app collections admins may browse/edit. Keys match Mongoose collection names.
 */
const pairs = [
    [User, 'Users'],
    [PaperSubmission, 'Paper submissions'],
    [Review, 'Reviews (legacy)'],
    [ReviewerReview, 'Reviewer reviews'],
    [ReviewerAssignment, 'Reviewer assignments'],
    [ReReview, 'Re-reviews'],
    [Revision, 'Revisions'],
    [RevisionReview, 'Revision reviews'],
    [ReviewerMessage, 'Reviewer messages'],
    [PaperMessage, 'Paper messages'],
    [SupportMessage, 'Support messages'],
    [Copyright, 'Copyright forms'],
    [PaymentRegistration, 'Payment registrations'],
    [PaymentDoneFinalUser, 'Payment done (final)'],
    [FinalAcceptance, 'Final acceptances'],
    [RejectedPaper, 'Rejected papers'],
    [ConferenceSelectedUser, 'Conference selected users'],
    [ListenerRegistration, 'Listener registrations'],
    [Committee, 'Committees'],
    [CommitteeMember, 'Committee members']
];

export const ADMIN_DB_REGISTRY = pairs.map(([model, label]) => ({
    key: model.collection.name,
    model,
    label
}));

const byKey = new Map(ADMIN_DB_REGISTRY.map((e) => [e.key, e]));

export function getAdminModel(collectionKey) {
    const entry = byKey.get(collectionKey);
    return entry ? entry.model : null;
}

export function listAdminCollectionsMeta() {
    return ADMIN_DB_REGISTRY.map(({ key, label }) => ({ key, label }));
}

export function isValidObjectIdString(id) {
    return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}
