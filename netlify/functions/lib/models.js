import mongoose from 'mongoose';

const schemaOptions = { strict: false, timestamps: true };

const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true },
}, schemaOptions);

const visitSchema = new mongoose.Schema({
    visitId: { type: String, required: true, unique: true },
}, schemaOptions);

const resultSchema = new mongoose.Schema({
    visitId: { type: String, required: true },
}, schemaOptions);

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, required: true, unique: true },
}, schemaOptions);

const settingsSchema = new mongoose.Schema({}, schemaOptions);
const auditLogSchema = new mongoose.Schema({}, schemaOptions);
const profileSchema = new mongoose.Schema({
    profileId: { type: String, required: true, unique: true }
}, schemaOptions);
const testMasterSchema = new mongoose.Schema({
    testId: { type: String, required: true, unique: true }
}, schemaOptions);

const financialExpenseSchema = new mongoose.Schema({
    expenseId: { type: String, required: true, unique: true }
}, schemaOptions);

const financialCategorySchema = new mongoose.Schema({
    categoryId: { type: String, required: true, unique: true }
}, schemaOptions);

const financialReminderSchema = new mongoose.Schema({
    reminderId: { type: String, required: true, unique: true }
}, schemaOptions);

export const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
export const Visit = mongoose.models.Visit || mongoose.model('Visit', visitSchema);
export const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
export const TestMaster = mongoose.models.TestMaster || mongoose.model('TestMaster', testMasterSchema);
export const FinancialExpense = mongoose.models.FinancialExpense || mongoose.model('FinancialExpense', financialExpenseSchema);
export const FinancialCategory = mongoose.models.FinancialCategory || mongoose.model('FinancialCategory', financialCategorySchema);
export const FinancialReminder = mongoose.models.FinancialReminder || mongoose.model('FinancialReminder', financialReminderSchema);
