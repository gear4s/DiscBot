const {Return} = require("./return.js")

try {
	const tests = async () => {
		let counter = 0
		const tests = ["Array", "Object", "Array !== Object", "Number", "String", "Class", "Function !== Class", "Class !== Function"]

		// normal function
		const func = new Return((test) => {
		  return () => {
		  	console.log(`\n-- Test #${++counter}: ${tests[counter-1]}`, test, typeof test, "\n")
		  	return test
	  	}
		}).function.done

		// Array
		const func1 = new Return(await func([])).array.done
		await func1().catch(console.error)

		// Object
		const func2 = new Return(await func({})).object.done
		await func2().catch(console.error)

		// Array !== Object
		const func3 = new Return(await func([])).object.done
		await func3().catch(console.error) // chucks out error

		// Number
		const func4 = new Return(await func(5)).number.done
		await func4().catch(console.error)

		// String
		const func5 = new Return(await func("hi")).string.done
		await func5().catch(console.error)

		// Class
		class TestingClass {
			constructor() {}
		}
		const func6 = new Return(await func(new TestingClass())).instance(TestingClass).done
		await func6().catch(console.error)

		// Function !== Class
		const func7 = new Return(await func(new TestingClass())).function.done
		await func7().catch(console.error)

		// Class !== Function
		const func8 = new Return(await func(function() {})).instance(TestingClass).done
		await func8().catch(console.error)
	}
	tests()
} catch(e) {
	console.log(e)
}