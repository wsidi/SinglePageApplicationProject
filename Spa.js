document.addEventListener('DOMContentLoaded', () => {
    let totalQuestion = 5;
    let questionsRight = 0;
    let questionsWrong = 0;
    
    // Initialize the leaderboard
    document.getElementById("TotalQuestions").innerHTML = `Total Questions: ${totalQuestion}`;
    document.getElementById("QuestionsWrong").innerHTML = `Questions Wrong: ${questionsWrong}`;
    document.getElementById("QuestionsRight").innerHTML = `Questions Right: ${questionsRight}`;
    
    // Get the form element
    const form = document.querySelector('form.whatKindOfFishIsThis');
    
    // Add submit event listener to the form
    form.addEventListener('submit', (event) => {
        // Prevent the form from submitting and reloading the page
        event.preventDefault();
        
        // Get the answer from the input box
        const answer = document.getElementById("answerBox").value;
        
        // Check if the answer is correct
        if(answer === "Atlantic Sturgeon"){
            questionsRight++;
        } else {
            questionsWrong++;
        }
        
        // Update the leaderboard display
        document.getElementById("QuestionsWrong").innerHTML = `Questions Wrong: ${questionsWrong}`;
        document.getElementById("QuestionsRight").innerHTML = `Questions Right: ${questionsRight}`;
        
        // Clear the input box for the next question
        document.getElementById("answerBox").value = "";
    });
});


var render_view = (view_id, model_index)=>{
    console.log("Rendering View");
    var source = document.querySelector(view_id).innerHTML;
    var template = Handlebars.compile(source)
    var html = template(model[model_index]);

    document.querySelector("#currentSpace").innerHTML
}