interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

enum ProjectStatus {
    Active, Finished
}

type Listener = (items: Project[]) => void;

class Project {

    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ){}
}

// validation function for user input
function validate(validatableInput: Validatable){
    let isValid = true;
    if(validatableInput.required){
        isValid = isValid && validatableInput.value.toString().trim().length > 0;
    }
    if(validatableInput.minLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if(validatableInput.maxLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if(validatableInput.min != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if(validatableInput.max != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value <= validatableInput.max
    }
    return isValid;
}

// autobind decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get(){
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjDescriptor;
}


class ProjectState {
    private projects: Project[] = [];
    private static instance: ProjectState;
    private listeners: Listener[] = [];

    constructor(){}

    static getInstance(){
        if(this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, people: number){
        const project = new Project(Math.random().toString(),title, description, people, ProjectStatus.Active);
        this.projects.push(project);
        for(const listener of this.listeners){
            listener(this.projects.slice());
        }
    }

    addListener(listener: Listener){
        this.listeners.push(listener);
    }
}

const projectState = ProjectState.getInstance();

class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    private associatedProjects: Project[];

    constructor(private type: 'active' | 'finished'){
        this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;
        this.associatedProjects = [];
        const importNode = document.importNode(this.templateElement.content, true);
        this.element = importNode.firstElementChild as HTMLElement;
        this.element.id  = `${this.type}-projects`;
        
        projectState.addListener((projects: Project[]) => {
            const relativeProjects = projects.filter(project => {
                if(this.type === 'active'){
                    return project.status === ProjectStatus.Active;
                }
                return project.status === ProjectStatus.Finished;
            })
            this.associatedProjects = relativeProjects;
            this.renderProjects();
        })

        this.attach();
        this.renderContent();
    }

    private renderProjects(){
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML = '';
        for (const prjItem of this.associatedProjects){
            const li = document.createElement('li');
            li.textContent = prjItem.title;
            listEl.appendChild(li);
        }
    }

    private renderContent(){
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.innerText = this.type.toUpperCase() + ' PROJECTS'; 
    }

    private attach(){
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}

class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor(){
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';
        this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
        this.attach();
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }

    private getUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }
        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if(
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
        ){
            alert('Invalid input, please try again!');
            return;
        }else{
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }

    private clearInputs(){
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    private configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }

    @autobind
    private submitHandler(event: Event){
        event.preventDefault();
        const userInput = this.getUserInput();
        if(Array.isArray(userInput)){
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people);
            this.clearInputs();
        }
    }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');