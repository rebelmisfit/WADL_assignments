// Import necessary modules
import express from 'express';
import mongoose from 'mongoose';
import csv from 'csv-parser';
import { Readable } from 'stream';
import Student from '../model/student.model.js';

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Login controller
export const loginController = async (req, res) => {
  try {
    const { emailID, password } = req.body;

    // Validation
    if (!emailID || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if the email is for a teacher
    const isTeacherEmail = emailID.includes("@pict.edu");

    // Check if user exists
    let foundUser;
    if (isTeacherEmail) {
      foundUser = await Teacher.findOne({ emailID });
    } else {
      foundUser = await Student.findOne({ emailID });
    }

    if (!foundUser) {
      return res.status(200).send({
        success: false,
        message: "Email is not registered. Please sign up",
      });
    }

    // Check if password matches
    const match = await comparePassword(password, foundUser.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid password. Please enter correct password",
      });
    }

    // Send response
    res.status(200).send({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// Delete all students controller
export const deleteAllStudentsController = async (req, res) => {
  console.log("Im Here!!!!");
  try {
    await Student.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All students deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all students',
      error: error.message,
    });
  }
};

// Upload students controller
export const uploadStudentsController = async (req, res) => {
  try {
    const { file: studentFile } = req;
    console.log('Request file:', studentFile);
    if (!studentFile) {
      return res.status(400).send({
        success: false,
        message: 'File not found',
      });
    }
    const results = [];

    const stream = Readable.from(studentFile.buffer.toString('utf-8'));

    stream
      .pipe(csv())
      .on('data', (data) => {
        console.log('Raw CSV data:', data);
        try {
          const subjects = JSON.parse(data['subjects']);
          const labs = JSON.parse(data['labs']);
          console.log('Parsed subjects:', subjects);
          console.log('Parsed labs:', labs);
          const newStudentData = {
            rollNo: data['rollNo'],
            name: data['name'],
            attendance: parseFloat(data['attendance']),
            emailID: data['emailID'],
            batch: data['batch'],
            class: data['class'],
            attendance: data['attendance'],
            subjects,
            labs
          };
          results.push(newStudentData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      })
      .on('end', async () => {
        console.log('CSV reading completed. Contents:', results);

        try {
          const insertedStudents = await Student.insertMany(results, { maxTimeMS: 30000 });
          console.log('Data uploaded to MongoDB successfully!', insertedStudents);
          res.status(201).send({
            success: true,
            message: 'Data uploaded to MongoDB successfully!',
            insertedStudents,
          });
        } catch (error) {
          console.error('Error uploading data to MongoDB:', error);
          res.status(500).send({
            success: false,
            message: 'Error uploading data to MongoDB',
            error,
          });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error in student data upload',
      error,
    });
  }
};

// Main code to start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
