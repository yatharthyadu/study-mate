import mongoose from 'mongoose';

// A StudyMate account. Only the bcrypt hash of the password is stored.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// Never send the password hash to the client
userSchema.methods.toPublic = function () {
  return { _id: this._id, email: this.email };
};

export const User = mongoose.model('User', userSchema);
