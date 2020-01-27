const mongoose = require('mongoose')
var FCM = require('fcm-node')
var serverKey = 'AAAA1c07Ogk:APA91bGBHY1BcODcHD1k-rkZ7V9KEIMBe-eV7mHICL35bx91nzrqJ31t3oUeuX7ZK2JYArQSqGuQBKL89d4ddpC4CYzVCT6skQE1_2qVUkq_QlV09r_rXPLZ0dAlT8-lbadBPjwoBJ7a'
const fcm = new FCM(serverKey)
const appointment = require('./Models/Appointments')
function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time]

  if (time.length > 1) { // If time format correct
    time = time.slice(1) // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM' // Set AM/PM
    time[0] = +time[0] % 12 || 12 // Adjust hours
  }
  return time.join('') // return adjusted time or original string
}
var dayInMilliseconds = 1000 * 60 * 60 * 24
// Connection TO Database
mongoose.connect(' mongodb+srv://taaha827:randompassword@cluster0-xezp5.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log('Connection Successfull')
  setInterval(() => {
      console.log('In first set interval')
    appointment.find({ status: 'accepted' })
      .populate('owner', { notificationToken: 1, firstName: 1, lastName: 1 })
      .populate('customer', { firstName: 1, lastName: 1 })
      .populate('store', { name: 1 })
      .then(result => {
        result.forEach(element => {
          const meetingTime = new Date(element.meetingDate)
          meetingTime.setHours(element.startTime, 0, 0, 0)
          var diff = Math.abs(meetingTime - new Date())
          var minutes = Math.floor((diff / 1000) / 60)
          if ((minutes < 20 && minutes > 15) || minutes <= 5) {
            const messages = []
            messages.push({
              to: element.customer.notificationToken,
              notification: {
                title: 'Upcoming Appointment ',
                body: `Your Appointment with ${element.owner.firstName + ' ' + element.owner.lastName} in store at ${tConvert(element.startTime + ':00:00')}
                        ${element.store.name}
                        `
              },
              data: {
                type: 'appointment',
                value: `Your Appointment with ${element.owner.firstName + ' ' + element.owner.lastName} in store
                        ${element.store.name} at ${tConvert(element.startTime + ':00:00')}
                        `,
                customerName: `${element.customer.firstName} ${element.customer.lastName}`,
                customerId: element.customer._id,
                appointmentId: element._id,
                ownerId: element.owner._id,
                storeId: element.store._id,
                status: element.status,
                meetingDate: element.meetingDate,
                startTime: element.startTime
              }
            })
            messages.push({
              to: element.customer.notificationToken,
              notification: {
                title: 'Upcoming Appointment ',
                body: `Your Appointment with ${element.customer.firstName + ' ' + element.customer.lastName} in store
                        ${element.store.name}
                        `
              },
              data: {
                type: 'appointment',
                value: `Your Appointment with ${element.customer.firstName + ' ' + element.customer.lastName} in store
                        ${element.store.name}
                        `,
                customerName: `${element.customer.firstName} ${element.customer.lastName}`,
                customerId: element.customer._id,
                appointmentId: element._id,
                ownerId: element.owner._id,
                storeId: element.store._id,
                status: element.status,
                meetingDate: element.meetingDate,
                startTime: element.startTime
              }
            })
            for (let index = 0; index < messages.length; index++) {
              const message = messages[index]
              if (message.to !== '') {
                fcm.send(message, function (err, response) {
                  if (err) {
                    console.log(err)
                    console.log('Something went wrong')
                  } else {
                    console.log('Successful ', response)
                  }
                })
              }
            }
          }
        })
      })
      .catch(err => {
        console.log(err)
      })
  }, 600000)

  setInterval(() => {
    console.log('In Second set interval')
    appointment.find({ status: 'pending' })
      .then(result => {
        result.forEach(element => {
          const creationDate = new Date(element.date)
          const currentDate = new Date()
          // To calculate the time difference of two dates
          var DT = currentDate.getTime() - creationDate.getTime()
          // To calculate the no. of days between two dates
          var DD = DT / (1000 * 3600 * 24)
          DD = Math.trunc(DD)
          console.log('Difference in days', DD)
          if (DD > 3) {
            // element.update({status:'cancelled'})
          }
        })
      })
  }, dayInMilliseconds)
})
