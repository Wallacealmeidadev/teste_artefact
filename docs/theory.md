# Rendering and backend design

## 1a. How do CSR, SSR and SSG work?

With client-side rendering (CSR), the browser runs JavaScript to build the data-dependent view. For example, it can receive a page shell, request a list from an API and then display the records. The API can still run on a server.

With server-side rendering (SSR), a request triggers rendering on the server. In this application, the home page reads the current tasks and sends their headings in the HTML. The browser can display the list before JavaScript attaches the event handlers for deletion.

With static site generation (SSG), a build produces HTML that can be reused across requests. A Server Component can participate in either static generation or request-time rendering. The distinction is when the data is read and how long the resulting page can be reused.

## 1b. When would each strategy help or cause problems?

CSR suits an interactive analytics dashboard where users repeatedly change filters. After the first load, the browser can update one chart at a time. On a slow connection, downloading JavaScript and then fetching data can delay the first meaningful view.

SSR suits this task list because another tab can change it between requests. Each visit can include the current data in the first response. The server pays the rendering cost for each visit, and a slow data source increases response time.

SSG suits a help article that changes only when the documentation is published. A CDN can serve the generated file cheaply. Using the same lifetime for the task list would let users see tasks that had already been deleted. The empty creation form, however, can be generated ahead of time.

## 2a. How can a web backend be implemented?

One option is to keep routing, business rules and storage access in the same application as the web interface. This project uses that approach. A change to a procedure and its TypeScript caller can be built and deployed together.

Another option is a separately deployed API, such as a Spring Boot service shared by a web app and a mobile app. It can scale independently, but clients and server must handle network failures and compatible contract changes. A larger product may split that backend into services when specific domains need independent ownership or scaling.

A platform can also run request handlers as functions and manage their instances. That is convenient for sporadic traffic. A task collection kept in one function instance's memory cannot provide a shared, durable task list across instances. REST, GraphQL and RPC describe ways to expose operations and data across these deployment choices.

## 2b. What are the trade-offs of tRPC?

My professional background includes TypeScript and REST APIs. My hands-on example with tRPC is this exercise. The server exports the router type, and the browser imports that type to infer the allowed procedure names, inputs and outputs. Renaming a field can reveal affected callers during typechecking. This works especially well when both ends use TypeScript and can evolve together. An independently released mobile client or a Python consumer needs an explicit compatibility strategy.

Static types disappear at runtime. A caller can send malformed JSON or omit the required title. Each write procedure validates its input with Zod before touching the store. Procedures return distinct errors for invalid input and missing records. A private multi-user application would also need authentication and per-record authorization. Type inference cannot establish who may read or change a task.

The same router supports HTTP calls from the browser and direct calls from the server-rendered page. The direct path avoids a network round trip for the initial list. tRPC does not resolve shared state, database contention or the cost of returning a large collection. Replicating this process would produce separate task lists. Scaling beyond this exercise would first require shared storage and a bounded list query, regardless of the API style.

## Repository

[Task Manager on GitHub](https://github.com/Wallacealmeidadev/teste_artefact)
