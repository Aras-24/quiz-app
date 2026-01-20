const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true, trim: true,  minlength: 4 },
     password: { type: String, required: true, minlength: 8}
},{ timestamps: true });

// Vor dem Speichern: Passwort hashen
userSchema.pre('save', async function(next){
    const user = this;

    // wenn passwort geädert oder neu hashen
    // Wenn Passwort nicht geändert wurde
    if(!user.isModified('password')){
        return next();
    }

    try{
        const saltRounds = 12; 
        const hashedpassword = await bcrypt.hash(user.password,saltRounds);
        user.password = hashedpassword;
        next();

    }catch(err){
        next(err); 
    }
});

// Passwort prüfen (für Login)
userSchema.methods.comparePassword = async function(candidatePassword){
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        return false; 
    }
};

module.exports = mongoose.model('User', userSchema);