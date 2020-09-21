const socket = io()

// server(emit)-> client(receive) --acknowledgement--> server
// client(emit)-> server(receive) --acknowledgement--> client

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll=()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin 

   // Visible height
   const visibleHeight = $messages.offsetHeight
   
   //Height of messages container
   const containerHeight = $messages.scrollHeight

   //How far have I scrolled
   const scrolloffset = $messages.scrollTop + visibleHeight

   if(containerHeight - newMessageHeight <= scrolloffset) {
       $messages.scrollTop = $messages.scrollHeight

   }


}



socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on('locationMessage', (urlMessage)=>{
    console.log(urlMessage)
    const html = Mustache.render(urlTemplate, {
        username: urlMessage.username,
        url: urlMessage.url,
        createdAt: moment(urlMessage.createdAt).format('h:mm:a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on('roomData', ({room, users})=>{
    // console.log(room)
    // console.log(users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable button
    $messageFormButton.setAttribute('disabled', 'disabled')

    const messageFromClient = e.target.elements.message.value
    
    socket.emit('sendMessage', messageFromClient,(error)=>{
       // enable button
       $messageFormButton.removeAttribute('disabled') 
       // clear Input field
       $messageFormInput.value=''
       $messageFormInput.focus()

        //console.log('This message was delivered', confirmationMessageFromServer)
        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    })
    
})

$sendLocationButton.addEventListener('click', ()=>{
     
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    
    // disable button
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {latitude: position.coords.latitude, longitude: position.coords.longitude},()=>{
                                         console.log('Location shared!')
                                          // enable button
                                          $sendLocationButton.removeAttribute('disabled') 
                                     })
    })

    
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }

})